const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const Question = require('../src/models/Question');

const backupSchema = new mongoose.Schema({
  originalId: mongoose.Schema.Types.ObjectId,
  fullRunnerCode: mongoose.Schema.Types.Mixed,
  originalStarterCode: mongoose.Schema.Types.Mixed,
  backedUpAt: Date,
});

const Backup = mongoose.model('QuestionBackup', backupSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const backups = await Backup.find({});
    console.log(`Found ${backups.length} backup records`);

    let restoredCount = 0;

    for (const backup of backups) {
      const update = {};

      if (backup.fullRunnerCode && Object.keys(backup.fullRunnerCode).length > 0) {
        update.fullRunnerCode = backup.fullRunnerCode;
      }

      if (backup.originalStarterCode && Object.keys(backup.originalStarterCode).length > 0) {
        update.starterCode = backup.originalStarterCode;
      }

      if (Object.keys(update).length > 0) {
        await Question.updateOne({ _id: backup.originalId }, { $set: update });
        restoredCount++;
      }

      // Optional: delete backup after restore
      // await Backup.deleteOne({ _id: backup._id });
    }

    console.log(`✅ Restored fullRunnerCode and original starterCode for ${restoredCount} questions`);
    console.log('Restore completed');
    process.exit(0);
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

run();