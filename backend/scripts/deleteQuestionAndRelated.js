const mongoose = require('mongoose');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Question = require('../src/models/Question');
const UserQuestionProgress = require('../src/models/UserQuestionProgress');
const RevisionSchedule = require('../src/models/RevisionSchedule');
const CodeExecutionHistory = require('../src/models/CodeExecutionHistory');
const ActivityLog = require('../src/models/ActivityLog');
const PatternMastery = require('../src/models/PatternMastery');

const QUESTION_ID_TO_DELETE = '69ca436c5ad0914efcd6433c';

async function askConfirmation(questionId) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(
      `⚠️  WARNING: You are about to delete question ${questionId} and ALL associated data.\n` +
      `Type 'DELETE' or the question ID (${questionId}) to confirm: `,
      (answer) => {
        rl.close();
        resolve(answer === 'DELETE' || answer === questionId);
      }
    );
  });
}

async function deleteQuestionAndRelated() {
  try {
    const confirmed = await askConfirmation(QUESTION_ID_TO_DELETE);
    if (!confirmed) {
      console.log('Deletion cancelled.');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Get question details (for logging)
    const question = await Question.findById(QUESTION_ID_TO_DELETE);
    if (!question) {
      console.log(`Question ${QUESTION_ID_TO_DELETE} not found. Nothing to delete.`);
      await mongoose.disconnect();
      return;
    }
    console.log(`Found question: "${question.title}" (${question._id})`);

    // 2. Delete all UserQuestionProgress for this question
    const progressResult = await UserQuestionProgress.deleteMany({ questionId: QUESTION_ID_TO_DELETE });
    console.log(`✓ Deleted ${progressResult.deletedCount} progress records`);

    // 3. Delete all RevisionSchedule for this question
    const revisionResult = await RevisionSchedule.deleteMany({ questionId: QUESTION_ID_TO_DELETE });
    console.log(`✓ Deleted ${revisionResult.deletedCount} revision schedules`);

    // 4. Delete all CodeExecutionHistory for this question
    const execResult = await CodeExecutionHistory.deleteMany({ questionId: QUESTION_ID_TO_DELETE });
    console.log(`✓ Deleted ${execResult.deletedCount} code execution history entries`);

    // 5. Delete all ActivityLog entries targeting this question
    const activityResult = await ActivityLog.deleteMany({
      targetId: QUESTION_ID_TO_DELETE,
      targetModel: 'Question'
    });
    console.log(`✓ Deleted ${activityResult.deletedCount} activity logs`);

    // 6. Remove this question from PatternMastery.recentQuestions arrays
    const patternUpdateResult = await PatternMastery.updateMany(
      { 'recentQuestions.questionId': QUESTION_ID_TO_DELETE },
      { $pull: { recentQuestions: { questionId: QUESTION_ID_TO_DELETE } } }
    );
    console.log(`✓ Updated ${patternUpdateResult.modifiedCount} pattern mastery documents (removed question from recentQuestions)`);

    // 7. Finally, delete the question itself
    await Question.findByIdAndDelete(QUESTION_ID_TO_DELETE);
    console.log(`✓ Deleted question: ${question.title}`);

    console.log('\n✅ All related data successfully deleted.');
  } catch (error) {
    console.error('❌ Error during deletion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

deleteQuestionAndRelated();