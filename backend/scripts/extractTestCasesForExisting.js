// Load environment variables
require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const config = require('../src/config');
const Question = require('../src/models/Question');
const { extractTestCasesFromHtml } = require('../src/services/queueHandlers/questionExtractTestCases.hanlder');

async function main() {
  try {
    await mongoose.connect(config.database.uri, config.database.connectionOptions);
    console.log('MongoDB connected');

    // Find all questions that have contentRef
    const questions = await Question.find({
      contentRef: { $exists: true, $ne: '' }
    });
    console.log(`Found ${questions.length} questions`);

    let updatedCount = 0;
    for (const q of questions) {
      try {
        const extracted = extractTestCasesFromHtml(q.contentRef);
        if (extracted.length > 0) {
          // Update only if the extracted test cases differ
          const existingKeys = (q.testCases || []).map(tc => `${tc.stdin}|${tc.expected}`);
          const newKeys = extracted.map(tc => `${tc.stdin}|${tc.expected}`);
          if (JSON.stringify(existingKeys) !== JSON.stringify(newKeys)) {
            q.testCases = extracted;
            await q.save();
            updatedCount++;
            console.log(`✅ Updated ${q._id} (${q.title}) with ${extracted.length} test cases`);
          } else {
            console.log(`⏭️  No change for ${q._id} (${q.title})`);
          }
        } else {
          console.log(`⚠️  No test cases found for ${q._id} (${q.title})`);
        }
      } catch (err) {
        console.error(`❌ Failed for ${q._id} (${q.title}):`, err.message);
      }
      // Small delay to avoid overloading
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`Done. Updated ${updatedCount} questions.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();