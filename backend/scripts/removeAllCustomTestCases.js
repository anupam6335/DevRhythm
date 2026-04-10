const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const UserQuestionProgress = require('../src/models/UserQuestionProgress');

async function removeAllCustomTestCases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await UserQuestionProgress.updateMany(
      { customTestCases: { $exists: true, $ne: [] } },
      { $set: { customTestCases: [] } }
    );

    console.log(`Removed custom test cases from ${result.modifiedCount} user progress records.`);
    console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Cleanup completed.');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

removeAllCustomTestCases();