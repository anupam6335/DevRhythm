const Question = require('../../models/Question');
const { generateFullRunner } = require('../codeRunnerGenerator.service');

const handleQuestionGenerateRunner = async (job) => {
  const { questionId } = job.data;
  console.log(`[generate-runner] Starting for question ${questionId}`);

  try {
    const question = await Question.findById(questionId);
    if (!question) throw new Error(`Question ${questionId} not found`);

    if (!question.starterCode || question.starterCode.size === 0) {
      console.log(`[generate-runner] No starterCode for question ${questionId}`);
      return;
    }

    if (!question.testCases || question.testCases.length === 0) {
      console.log(`[generate-runner] No test cases for question ${questionId}, skipping`);
      return;
    }

    const fullRunners = {};

    // Correctly iterate over the Mongoose Map
    for (const [lang, stub] of question.starterCode) {
      try {
        fullRunners[lang] = generateFullRunner(lang, stub, question.testCases);
      } catch (err) {
        console.error(`Failed to generate full runner for ${lang}:`, err.message);
        fullRunners[lang] = stub; // fallback to stub
      }
    }

    question.fullRunnerCode = fullRunners;
    await question.save();
    console.log(`[generate-runner] Full runner code generated for ${Object.keys(fullRunners).length} languages`);
  } catch (error) {
    console.error(`[generate-runner] Error for question ${questionId}:`, error);
    throw error;
  }
};

module.exports = { handleQuestionGenerateRunner };