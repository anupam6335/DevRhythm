const { orchestrateExecution } = require('../services/codeExecution/executionOrchestrator.service');
const { formatResponse } = require('../utils/helpers/response');
const AppError = require('../utils/errors/AppError');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const CodeExecutionHistory = require('../models/CodeExecutionHistory');
const RevisionSchedule = require('../models/RevisionSchedule');
const revisionActivityService = require('../services/revisionActivity.service');
const { invalidateCache, invalidateProgressCache } = require('../middleware/cache');
const { jobQueue } = require('../services/queue.service');
const testCaseParser = require('../services/testCaseParser.service');

const SUPPORTED_LANGUAGES = ['cpp', 'python', 'java', 'javascript'];

/**
 * Main code execution endpoint.
 * Uses the new metadata‑driven pipeline.
 */
const runCode = async (req, res, next) => {
    try {
        let { language, code, stdin, expected, testCases, questionId } = req.body;

        // Input validation
        if (!SUPPORTED_LANGUAGES.includes(language)) {
            throw new AppError(`Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`, 400);
        }
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
            throw new AppError('Code cannot be empty', 400);
        }
        if (!questionId) {
            throw new AppError('questionId is required', 400);
        }

        // Fetch question and user progress
        const [question, userProgress] = await Promise.all([
            Question.findById(questionId).lean(),
            UserQuestionProgress.findOne({ userId: req.user._id, questionId })
        ]);
        if (!question) throw new AppError('Question not found', 404);

        // Build test cases: default (structured) + user custom + provided
        let defaultTestCases = [];
        if (question.testCasesStructured && question.testCasesStructured.length > 0) {
            defaultTestCases = question.testCasesStructured;
        } else if (question.testCases && question.testCases.length > 0) {
            // Fallback: convert raw test cases on the fly (should be rare after backfill)
            defaultTestCases = testCaseParser.convertToStructuredTestCases(question.testCases, {
                paramTypes: question.paramTypes || [],
                returnType: question.returnType || 'any'
            });
        }

        let userCustomTestCases = [];
        if (userProgress && userProgress.customTestCases && Array.isArray(userProgress.customTestCases)) {
            userCustomTestCases = userProgress.customTestCases.map(tc => ({
                args: testCaseParser.parseInputString(tc.stdin),
                expected: testCaseParser.parseExpectedString(tc.expected)
            }));
        }

        let finalTestCases = [...defaultTestCases, ...userCustomTestCases];
        if (testCases && Array.isArray(testCases)) {
            const provided = testCases.map(tc => ({
                args: testCaseParser.parseInputString(tc.stdin),
                expected: testCaseParser.parseExpectedString(tc.expected || '')
            }));
            finalTestCases.push(...provided);
        } else if (stdin !== undefined) {
            finalTestCases.push({
                args: testCaseParser.parseInputString(stdin),
                expected: testCaseParser.parseExpectedString(expected || '')
            });
        }

        if (finalTestCases.length === 0) {
            throw new AppError('No test cases available for this question', 400);
        }

        // Deduplicate test cases
        const seen = new Set();
        const uniqueTestCases = [];
        for (const tc of finalTestCases) {
            const key = JSON.stringify(tc.args) + '|' + JSON.stringify(tc.expected);
            if (!seen.has(key)) {
                seen.add(key);
                uniqueTestCases.push(tc);
            }
        }
        finalTestCases = uniqueTestCases;

        // Execute using the new orchestrator
        const executionResult = await orchestrateExecution({
            language,
            userCode: code,
            question,
            testCases: finalTestCases,
            options: {}
        });

        // Save execution history
        await CodeExecutionHistory.create({
            userId: req.user._id,
            questionId,
            language,
            code: code,
            testCases: executionResult.results.map(r => ({
                stdin: JSON.stringify(r.input),
                expected: r.expected,
                output: r.output,
                error: r.error,
                exitCode: r.exitCode,
                passed: r.passed
            })),
            summary: {
                passedCount: executionResult.passedCount,
                totalCount: executionResult.totalCount,
                allPassed: executionResult.allPassed,
                defaultTestCasesCount: defaultTestCases.length,
                userCustomTestCasesCount: userCustomTestCases.length,
                customTestCasesCount: testCases?.length || (stdin ? 1 : 0)
            }
        });

        // Cleanup old history (keep 1 all-passed + 2 latest)
        await cleanupExecutionHistory(req.user._id, questionId, language);

        // Save custom test cases (deduplicate)
        await saveCustomTestCases(req.user._id, questionId, testCases, stdin, expected, defaultTestCases);

        // Prepare response
        let responseData = {
            questionId,
            results: executionResult.results,
            passedCount: executionResult.passedCount,
            totalCount: executionResult.totalCount,
            allPassed: executionResult.allPassed,
            defaultTestCasesCount: defaultTestCases.length,
            userCustomTestCasesCount: userCustomTestCases.length,
            customTestCasesCount: testCases?.length || (stdin ? 1 : 0)
        };

        // Update progress and revision schedule if all tests passed
        if (executionResult.allPassed) {
            await handleAllPassed(req.user._id, questionId, executionResult, responseData);
        }

        return res.json(formatResponse('Code executed successfully', responseData));
    } catch (error) {
        next(error);
    }
};

// ========== Helper Functions (extracted for clarity) ==========

async function cleanupExecutionHistory(userId, questionId, language) {
    const records = await CodeExecutionHistory.find({ userId, questionId, language }).sort({ executedAt: -1 });
    const passedRecords = records.filter(r => r.summary?.allPassed === true);
    const nonPassedRecords = records.filter(r => r.summary?.allPassed !== true);
    const toDelete = [];
    if (passedRecords.length > 1) toDelete.push(...passedRecords.slice(1).map(r => r._id));
    if (nonPassedRecords.length > 2) toDelete.push(...nonPassedRecords.slice(2).map(r => r._id));
    if (toDelete.length) await CodeExecutionHistory.deleteMany({ _id: { $in: toDelete } });
}

async function saveCustomTestCases(userId, questionId, testCases, stdin, expected, defaultTestCases) {
    let customToSave = [];
    if (testCases && Array.isArray(testCases)) {
        customToSave = testCases;
    } else if (stdin !== undefined) {
        customToSave = [{ stdin: stdin || '', expected: expected || '' }];
    }
    if (customToSave.length === 0) return;

    const normalize = (str) => (str || '').replace(/\s/g, '');
    const isDuplicate = (tc, list) => list.some(ex => normalize(ex.stdin) === normalize(tc.stdin) && normalize(ex.expected) === normalize(tc.expected));

    const existingProgress = await UserQuestionProgress.findOne({ userId, questionId });
    let existingCustom = existingProgress?.customTestCases || [];
    const uniqueIncoming = [];
    const seen = new Set();
    for (const tc of customToSave) {
        const key = `${normalize(tc.stdin)}|${normalize(tc.expected)}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueIncoming.push(tc);
        }
    }
    const filtered = uniqueIncoming.filter(tc => !isDuplicate(tc, defaultTestCases) && !isDuplicate(tc, existingCustom));
    if (filtered.length) {
        const merged = [...existingCustom, ...filtered];
        await UserQuestionProgress.findOneAndUpdate(
            { userId, questionId },
            { $set: { customTestCases: merged.map(tc => ({ stdin: tc.stdin, expected: tc.expected, updatedAt: new Date() })) } },
            { upsert: true }
        );
    }
}

async function handleAllPassed(userId, questionId, executionResult, responseData) {
    // Update progress
    let progress = await UserQuestionProgress.findOne({ userId, questionId });
    if (!progress) {
        progress = new UserQuestionProgress({
            userId,
            questionId,
            status: 'Solved',
            attempts: { count: 1, solvedAt: new Date(), lastAttemptAt: new Date(), firstAttemptAt: new Date() },
            totalTimeSpent: 0
        });
    } else if (progress.status !== 'Solved') {
        progress.status = 'Solved';
        progress.attempts.solvedAt = new Date();
        progress.attempts.lastAttemptAt = new Date();
        progress.attempts.count = (progress.attempts.count || 0) + 1;
    }
    await progress.save();
    await invalidateProgressCache(userId);

    // Enqueue question.solved job
    if (jobQueue) {
        await jobQueue.add({
            type: 'question.solved',
            userId,
            questionId,
            progressId: progress._id,
            timeSpent: 0,
            solvedAt: new Date()
        });
    }

    // Record code submission for revision activity
    await revisionActivityService.recordCodeSubmission(userId, questionId, new Date());

    // Check if revision completed
    const revisionResult = await revisionActivityService.checkAndCompleteRevision(userId, questionId, new Date(), 'auto');
    if (revisionResult.completed) {
        responseData.revisionCompleted = true;
        responseData.revisionMessage = revisionResult.message;
    }

    // Create revision schedule if not exists
    const existingRevision = await RevisionSchedule.findOne({ userId, questionId });
    if (!existingRevision) {
        const baseDate = new Date();
        const schedule = [1, 3, 7, 14, 30].map(days => {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + days);
            d.setHours(0, 0, 0, 0);
            return d;
        });
        await RevisionSchedule.create({
            userId,
            questionId,
            schedule,
            baseDate,
            status: 'active'
        });
        await invalidateCache(`revisions:*:user:${userId}:*`);
    }
}

module.exports = { runCode };