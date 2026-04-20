const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const RevisionSchedule = require('../src/models/RevisionSchedule');

// Backup collection schema
const backupSchema = new mongoose.Schema({
  originalId: mongoose.Schema.Types.ObjectId,
  originalDocument: mongoose.Schema.Types.Mixed,
  backedUpAt: Date,
});

const Backup = mongoose.model('RevisionScheduleBackup', backupSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all revision schedules
    const schedules = await RevisionSchedule.find({});
    console.log(`📊 Found ${schedules.length} revision schedules`);

    let updatedCount = 0;
    let backupCount = 0;

    for (const schedule of schedules) {
      let needsUpdate = false;
      const originalDoc = schedule.toObject();

      // Backup if not already backed up
      const existingBackup = await Backup.findOne({ originalId: schedule._id });
      if (!existingBackup) {
        await Backup.create({
          originalId: schedule._id,
          originalDocument: originalDoc,
          backedUpAt: new Date(),
        });
        backupCount++;
      }

      // Process each completed revision entry
      if (schedule.completedRevisions && schedule.completedRevisions.length > 0) {
        for (const rev of schedule.completedRevisions) {
          // Add overdueCompleted if missing
          if (rev.overdueCompleted === undefined) {
            rev.overdueCompleted = rev.completedAt > rev.date;
            needsUpdate = true;
          }
          // Add skipped if missing (based on status field)
          if (rev.skipped === undefined) {
            rev.skipped = rev.status === 'skipped';
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await schedule.save();
        updatedCount++;
        console.log(`🔄 Updated schedule ${schedule._id} (${schedule.questionId})`);
      }
    }

    console.log(`\n✅ Migration completed:`);
    console.log(`   - Backed up: ${backupCount} schedules`);
    console.log(`   - Updated: ${updatedCount} schedules`);
    console.log(`   - Total processed: ${schedules.length}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

run();