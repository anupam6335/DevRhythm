const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Question = require('../src/models/Question');
const UserQuestionProgress = require('../src/models/UserQuestionProgress');

/**
 * Normalises a test case for duplicate detection.
 * Removes all whitespace from stdin and expected.
 * Returns null if expected is missing/invalid.
 */
function normalizeTestCase(tc) {
  if (!tc || tc.expected === undefined || tc.expected === null) return null;
  const stdin = (tc.stdin || '').replace(/\s/g, '');
  const expected = String(tc.expected).replace(/\s/g, '');
  return { stdin, expected };
}

/**
 * Removes duplicate test cases from an array.
 * Keeps the first occurrence of each unique normalised pair.
 * Also filters out invalid test cases (missing expected).
 */
function deduplicateArray(testCases) {
  const seen = new Set();
  const unique = [];
  for (const tc of testCases) {
    const norm = normalizeTestCase(tc);
    if (!norm) continue; // skip invalid test case
    const key = `${norm.stdin}|${norm.expected}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tc);
    }
  }
  return unique;
}

/**
 * Removes any test case that matches a default test case of the same question.
 * Also filters out invalid test cases.
 */
function removeDefaultMatches(customCases, defaultCases) {
  const defaultKeys = new Set();
  for (const def of defaultCases) {
    const norm = normalizeTestCase(def);
    if (norm) defaultKeys.add(`${norm.stdin}|${norm.expected}`);
  }
  return customCases.filter(tc => {
    const norm = normalizeTestCase(tc);
    if (!norm) return false;
    return !defaultKeys.has(`${norm.stdin}|${norm.expected}`);
  });
}

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Clean up Question.testCases
    let questionsUpdated = 0;
    const questions = await Question.find({});
    for (const question of questions) {
      const originalLength = question.testCases.length;
      const unique = deduplicateArray(question.testCases);
      if (unique.length !== originalLength) {
        question.testCases = unique;
        await question.save();
        questionsUpdated++;
        console.log(`Question ${question._id}: removed ${originalLength - unique.length} duplicate/invalid test cases`);
      }
    }
    console.log(`Questions cleaned: ${questionsUpdated}`);

    // 2. Clean up UserQuestionProgress.customTestCases
    let progressesUpdated = 0;
    let customRemoved = 0;
    const progresses = await UserQuestionProgress.find({})
      .populate('questionId', 'testCases');
    for (const progress of progresses) {
      if (!progress.customTestCases || progress.customTestCases.length === 0) continue;
      if (!progress.questionId) continue;

      const defaultTestCases = progress.questionId.testCases || [];
      let custom = progress.customTestCases;

      // Remove duplicates within custom array (also filters invalid)
      const uniqueCustom = deduplicateArray(custom);
      const removedInArray = custom.length - uniqueCustom.length;

      // Remove any custom test case that matches a default test case
      const filtered = removeDefaultMatches(uniqueCustom, defaultTestCases);
      const removedDefaults = uniqueCustom.length - filtered.length;

      if (removedInArray > 0 || removedDefaults > 0) {
        progress.customTestCases = filtered;
        await progress.save();
        progressesUpdated++;
        customRemoved += removedInArray + removedDefaults;
        console.log(`User ${progress.userId}, question ${progress.questionId._id}: removed ${removedInArray} internal duplicates + ${removedDefaults} default matches`);
      }
    }
    console.log(`UserQuestionProgress cleaned: ${progressesUpdated} users, ${customRemoved} duplicate custom test cases removed`);

    await mongoose.disconnect();
    console.log('Cleanup completed.');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();