const { executeBatch } = require('../services/codeExecution.service');
const { formatResponse } = require('../utils/helpers/response');
const AppError = require('../utils/errors/AppError');
const Question = require('../models/Question');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const CodeExecutionHistory = require('../models/CodeExecutionHistory');

const SUPPORTED_LANGUAGES = ['cpp', 'python', 'java', 'javascript'];

// Helper to normalize strings by removing all whitespace
const normalize = (str) => (str || '').replace(/\s/g, '');

const runCode = async (req, res, next) => {
  try {
    let { language, code, stdin, expected, testCases, questionId } = req.body;

    // Validate input
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
      UserQuestionProgress.findOne({ userId: req.user._id, questionId }),
    ]);

    if (!question) throw new AppError('Question not found', 404);

    // Extract default test cases from question
    let defaultTestCases = [];
    if (question.testCases && Array.isArray(question.testCases)) {
      defaultTestCases = question.testCases.map(tc => ({
        stdin: tc.stdin,
        expected: tc.expected,
      }));
    }

    // Extract user's custom test cases from progress
    let userCustomTestCases = [];
    if (userProgress && userProgress.customTestCases && Array.isArray(userProgress.customTestCases)) {
      userCustomTestCases = userProgress.customTestCases.map(tc => ({
        stdin: tc.stdin,
        expected: tc.expected,
      }));
    }

    // Build the final list of test cases
    let finalTestCases = [];

    if (testCases && Array.isArray(testCases)) {
      finalTestCases = [...defaultTestCases, ...userCustomTestCases, ...testCases];
    } else if (stdin !== undefined) {
      finalTestCases = [...defaultTestCases, ...userCustomTestCases, { stdin: stdin || '', expected: expected || '' }];
    } else {
      finalTestCases = [...defaultTestCases, ...userCustomTestCases];
    }

    if (finalTestCases.length === 0) {
      throw new AppError('No test cases available for this question', 400);
    }

    // Execute all test cases in a single batch
    const batchResults = await executeBatch({ language, code, testCases: finalTestCases });

    // Process results
    const results = batchResults.map((res, idx) => {
      const testCase = finalTestCases[idx];
      const actualOutput = res.stdout;
      const expectedOutput = testCase.expected || '';
      const normalizedActual = normalize(actualOutput);
      const normalizedExpected = normalize(expectedOutput);
      const passed = (normalizedExpected !== '') ? (normalizedActual === normalizedExpected) : false;

      return {
        input: testCase.stdin,
        output: actualOutput,
        expected: expectedOutput,
        error: res.stderr,
        exitCode: res.exitCode,
        passed,
      };
    });

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = finalTestCases.length;
    const allPassed = passedCount === totalCount;

    // Save custom test cases if provided in request
    let customToSave = [];
    if (testCases && Array.isArray(testCases)) {
      customToSave = testCases;
    } else if (stdin !== undefined) {
      customToSave = [{ stdin: stdin || '', expected: expected || '' }];
    }

    if (customToSave.length > 0) {
      const update = {
        $set: {
          customTestCases: customToSave.map(tc => ({
            stdin: tc.stdin,
            expected: tc.expected,
            updatedAt: new Date(),
          })),
        },
      };
      await UserQuestionProgress.findOneAndUpdate(
        { userId: req.user._id, questionId },
        update,
        { upsert: true, new: true }
      );
    }

    // Save execution history (non‑blocking) and keep only last 10
    CodeExecutionHistory.create({
      userId: req.user._id,
      questionId,
      language,
      code,
      testCases: results.map(r => ({
        stdin: r.input,
        expected: r.expected,
        output: r.output,
        error: r.error,
        exitCode: r.exitCode,
        passed: r.passed,
      })),
      summary: {
        passedCount,
        totalCount,
        allPassed,
        defaultTestCasesCount: defaultTestCases.length,
        userCustomTestCasesCount: userCustomTestCases.length,
        customTestCasesCount: customToSave.length,
      },
    }).then(async () => {
      // Count how many entries exist for this user and question
      const total = await CodeExecutionHistory.countDocuments({ userId: req.user._id, questionId });
      if (total > 10) {
        // Find IDs of oldest entries to delete (skip latest 10)
        const toDelete = await CodeExecutionHistory.find({ userId: req.user._id, questionId })
          .sort({ executedAt: -1 })
          .skip(10)
          .select('_id')
          .lean();
        if (toDelete.length) {
          const ids = toDelete.map(d => d._id);
          await CodeExecutionHistory.deleteMany({ _id: { $in: ids } });
        }
      }
    }).catch(err => console.error('Failed to save/cleanup execution history:', err));

    // Return response
    return res.json(formatResponse('Code executed successfully', {
      questionId,
      results,
      passedCount,
      totalCount,
      allPassed,
      defaultTestCasesCount: defaultTestCases.length,
      userCustomTestCasesCount: userCustomTestCases.length,
      customTestCasesCount: customToSave.length,
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = { runCode };