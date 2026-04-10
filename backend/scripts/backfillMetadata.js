const mongoose = require('mongoose');
const config = require('../src/config');
const Question = require('../src/models/Question');
const metadataExtractor = require('../src/services/metadataExtractor.service');
const testCaseParser = require('../src/services/testCaseParser.service');

async function backfill() {
  await mongoose.connect(config.database.uri);
  const questions = await Question.find({});
  let updated = 0;
  for (const q of questions) {
    let changed = false;
    // Extract metadata from starterCode if missing
    if (q.starterCode && !q.methodName) {
      for (const [lang, code] of Object.entries(q.starterCode)) {
        const meta = metadataExtractor.extractMetadata(lang, code);
        if (meta && meta.methodName) {
          q.methodName = meta.methodName;
          q.className = meta.className;
          q.paramTypes = meta.paramTypes;
          q.returnType = meta.returnType;
          q.isInteractive = meta.isInteractive;
          changed = true;
          break;
        }
      }
    }
    // Detect order irrelevance
    if (q.contentRef && !q.isOrderIrrelevant) {
      q.isOrderIrrelevant = metadataExtractor.detectOrderIrrelevant(q.contentRef);
      changed = true;
    }
    // Convert test cases to structured
    if (q.testCases && q.testCases.length > 0 && (!q.testCasesStructured || q.testCasesStructured.length === 0)) {
      const metadata = {
        paramTypes: q.paramTypes || [],
        returnType: q.returnType || 'any'
      };
      q.testCasesStructured = testCaseParser.convertToStructuredTestCases(q.testCases, metadata);
      changed = true;
    }
    if (changed) {
      await q.save();
      updated++;
      console.log(`Updated question ${q._id} (${q.title})`);
    }
  }
  console.log(`Backfill complete. Updated ${updated} questions.`);
  process.exit(0);
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});