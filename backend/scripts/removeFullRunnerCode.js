// scripts/removeFullRunnerCode.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Question = require('../src/models/Question');

const backupSchema = new mongoose.Schema({
  originalId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fullRunnerCode: { type: mongoose.Schema.Types.Mixed },
  originalStarterCode: { type: mongoose.Schema.Types.Mixed },
  backedUpAt: { type: Date, default: Date.now },
});
const Backup = mongoose.model('QuestionBackup', backupSchema);

const ALLOWED_LANGUAGES = ['C++', 'JavaScript', 'Java', 'Python', 'Python3'];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Backup all questions
    const questions = await Question.find({}).lean();
    console.log(`Found ${questions.length} questions`);

    for (const q of questions) {
      await Backup.create({
        originalId: q._id,
        fullRunnerCode: q.fullRunnerCode || {},
        originalStarterCode: q.starterCode || {},
      });
    }
    console.log(`✅ Backed up ${questions.length} questions`);

    // 2. Remove fullRunnerCode using native MongoDB driver (bypass Mongoose)
    const db = mongoose.connection.db;
    const collection = db.collection('questions');
    const result = await collection.updateMany({}, { $unset: { fullRunnerCode: '' } });
    console.log(`✅ Removed fullRunnerCode from ${result.modifiedCount} documents`);

    // 3. Filter starterCode for each question (using Mongoose model)
    let filteredCount = 0;
    let emptyCount = 0;

    for (const q of questions) {
      if (!q.starterCode || typeof q.starterCode !== 'object') continue;

      const originalKeys = Object.keys(q.starterCode);
      const filtered = {};
      let removed = 0;

      for (const [lang, code] of Object.entries(q.starterCode)) {
        if (ALLOWED_LANGUAGES.includes(lang)) {
          filtered[lang] = code;
        } else {
          removed++;
        }
      }

      if (removed > 0) {
        console.log(`Question ${q._id}: removed ${removed} unsupported language(s)`);
      }

      if (Object.keys(filtered).length === 0) {
        await Question.updateOne({ _id: q._id }, { $set: { starterCode: {} } });
        emptyCount++;
      } else if (Object.keys(filtered).length !== originalKeys.length) {
        await Question.updateOne({ _id: q._id }, { $set: { starterCode: filtered } });
        filteredCount++;
      }
    }

    console.log(`✅ Filtered starterCode for ${filteredCount} questions`);
    if (emptyCount) console.log(`⚠️ ${emptyCount} questions have no allowed language → starterCode set to {}`);

    // 4. Verify removal by fetching a random document
    const sample = await collection.findOne({}, { projection: { fullRunnerCode: 1 } });
    if (sample && sample.fullRunnerCode !== undefined) {
      console.error('❌ ERROR: fullRunnerCode still exists on at least one document!');
      console.error('Sample document _id:', sample._id);
      console.error('Sample fullRunnerCode:', sample.fullRunnerCode);
    } else {
      console.log('✅ Verification passed: fullRunnerCode is gone from the sample document.');
    }

    console.log('\n🎉 Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();