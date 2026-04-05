// scripts/cleanupCodeHistory.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load .env from backend root

const mongoose = require('../src/config/database'); // This already connects to MongoDB
const CodeExecutionHistory = require('../src/models/CodeExecutionHistory');

const cleanup = async () => {
  // Wait for the database connection to be established
  await mongoose.ready; // 'ready' is a promise exported by database.js

  console.log('Connected to MongoDB');

  // Group by userId, questionId, language
  const groups = await CodeExecutionHistory.aggregate([
    {
      $group: {
        _id: {
          userId: '$userId',
          questionId: '$questionId',
          language: '$language',
        },
        records: { $push: '$$ROOT' },
      },
    },
  ]);

  for (const group of groups) {
    const { userId, questionId, language } = group._id;
    let records = group.records;

    // Sort by executedAt descending (most recent first)
    records.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

    const passedRecords = records.filter((r) => r.summary?.allPassed === true);
    const nonPassedRecords = records.filter((r) => r.summary?.allPassed !== true);

    const toDelete = [];

    // Keep only the most recent passed record
    if (passedRecords.length > 1) {
      const extraPassed = passedRecords.slice(1);
      toDelete.push(...extraPassed.map((r) => r._id));
    }

    // Keep only the 2 most recent non‑passed records
    if (nonPassedRecords.length > 2) {
      const extraNonPassed = nonPassedRecords.slice(2);
      toDelete.push(...extraNonPassed.map((r) => r._id));
    }

    if (toDelete.length) {
      await CodeExecutionHistory.deleteMany({ _id: { $in: toDelete } });
      console.log(`Cleaned ${toDelete.length} records for user ${userId}, question ${questionId}, language ${language}`);
    }
  }

  console.log('Cleanup finished');
  await mongoose.disconnect();
};

cleanup().catch(console.error);