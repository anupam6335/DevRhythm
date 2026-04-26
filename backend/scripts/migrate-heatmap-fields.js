// scripts/migrate-heatmap-fields.js
const mongoose = require('mongoose');
const config = require('../src/config'); // adjust path to your config

const BACKUP_COLLECTION_PREFIX = 'HeatmapData_backup';

async function runMigration() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Dry run mode: ${dryRun}`);

  try {
    await mongoose.connect(config.database.uri, config.database.connectionOptions);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const heatmapCollection = db.collection('heatmapdatas'); // note: Mongoose collection name is lowercased plural

    // 1. Create backup (skip if dry-run)
    if (!dryRun) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${BACKUP_COLLECTION_PREFIX}_${timestamp}`;
      console.log(`Creating backup collection: ${backupName}`);
      await heatmapCollection.aggregate([{ $match: {} }, { $out: backupName }]).toArray();
      console.log(`Backup created. ${backupName} now contains ${await db.collection(backupName).countDocuments()} documents.`);
    }

    // 2. Update documents: add missing fields to each dailyData entry
    const pipeline = [
      // Add new fields to each dailyData element
      {
        $addFields: {
          dailyData: {
            $map: {
              input: '$dailyData',
              as: 'day',
              in: {
                $mergeObjects: [
                  '$$day',
                  {
                    testCaseExecutions: { $ifNull: ['$$day.testCaseExecutions', 0] },
                    passedCount: { $ifNull: ['$$day.passedCount', 0] },
                    failedCount: { $ifNull: ['$$day.failedCount', 0] },
                    timeSpentEvents: { $ifNull: ['$$day.timeSpentEvents', 0] },
                  },
                ],
              },
            },
          },
        },
      },
      // Replace the entire document with the new version
      { $set: { dailyData: '$dailyData' } },
    ];

    if (dryRun) {
      // Just count how many documents would be affected and show a sample
      const sample = await heatmapCollection.aggregate(pipeline).limit(1).toArray();
      console.log('Sample document after migration (first hit):');
      console.log(JSON.stringify(sample, null, 2));
      const count = await heatmapCollection.countDocuments();
      console.log(`Dry run: ${count} documents would be updated.`);
    } else {
      // Perform the update using updateMany with aggregation pipeline (requires MongoDB 4.2+)
      // Since update can't use aggregation pipeline directly, we use bulkWrite
      const bulkOps = [];
      const cursor = heatmapCollection.aggregate(pipeline);
      let count = 0;
      for await (const doc of cursor) {
        bulkOps.push({
          replaceOne: {
            filter: { _id: doc._id },
            replacement: doc,
          },
        });
        if (bulkOps.length >= 1000) {
          await heatmapCollection.bulkWrite(bulkOps);
          count += bulkOps.length;
          console.log(`Updated ${count} documents...`);
          bulkOps.length = 0;
        }
      }
      if (bulkOps.length > 0) {
        await heatmapCollection.bulkWrite(bulkOps);
        count += bulkOps.length;
        console.log(`Updated ${count} documents.`);
      }
      console.log('Migration completed successfully.');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();