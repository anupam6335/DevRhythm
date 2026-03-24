const { executeCode } = require('../services/codeExecution.service');
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

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // Extract default test cases from question
    let defaultTestCases = [];
    if (question.testCases && Array.isArray(question.testCases)) {
      defaultTestCases = question.testCases.map(tc => ({
        stdin: tc.stdin,
        expected: tc.expected,
      }));
    }

    // Extract user's custom test cases from progress (if any)
    let userCustomTestCases = [];
    if (userProgress && userProgress.customTestCases && Array.isArray(userProgress.customTestCases)) {
      userCustomTestCases = userProgress.customTestCases.map(tc => ({
        stdin: tc.stdin,
        expected: tc.expected,
      }));
    }

    // Build the final list of test cases
    let finalTestCases = [];

    // If request provides testCases, combine default + user custom + request custom
    if (testCases && Array.isArray(testCases)) {
      finalTestCases = [...defaultTestCases, ...userCustomTestCases, ...testCases];
    }
    // Else if request provides legacy stdin, treat as a single test case
    else if (stdin !== undefined) {
      finalTestCases = [...defaultTestCases, ...userCustomTestCases, { stdin: stdin || '', expected: expected || '' }];
    }
    // Else use only default + user custom
    else {
      finalTestCases = [...defaultTestCases, ...userCustomTestCases];
    }

    if (finalTestCases.length === 0) {
      throw new AppError('No test cases available for this question', 400);
    }

    // Execute all test cases
    const results = [];
    let passedCount = 0;

    for (const testCase of finalTestCases) {
      const result = await executeCode({ language, code, stdin: testCase.stdin });
      const actualOutput = result.stdout;
      const expectedOutput = testCase.expected || '';
      const normalizedActual = normalize(actualOutput);
      const normalizedExpected = normalize(expectedOutput);
      const passed = (normalizedExpected !== '') ? (normalizedActual === normalizedExpected) : false;

      results.push({
        input: testCase.stdin,
        output: actualOutput,
        expected: expectedOutput,
        error: result.stderr,
        exitCode: result.exitCode,
        passed,
      });

      if (passed) passedCount++;
    }

    // Save custom test cases if provided in request
    let customToSave = [];
    if (testCases && Array.isArray(testCases)) {
      customToSave = testCases;
    } else if (stdin !== undefined) {
      customToSave = [{ stdin: stdin || '', expected: expected || '' }];
    }

    if (customToSave.length > 0) {
      // Update or create user progress with the new custom test cases
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

    const totalCount = finalTestCases.length;
    const allPassed = passedCount === totalCount;

    // Save execution history
    await CodeExecutionHistory.create({
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
    });

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