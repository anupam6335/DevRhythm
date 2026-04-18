const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const RevisionSchedule = require('../src/models/RevisionSchedule');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Target the specific question
    const questionId = '69d238886f2740a9810c8754';
    const schedule = await RevisionSchedule.findOne({ questionId });
    if (!schedule) {
      console.log('❌ Schedule not found');
      process.exit(1);
    }

    console.log(`📊 Found schedule for question ${questionId}`);
    console.log(`   Current currentRevisionIndex: ${schedule.currentRevisionIndex}`);
    console.log(`   Completed revisions count: ${schedule.completedRevisions.length}`);

    // Keep only the April 5 completion (index 0)
    const april5Date = new Date('2026-04-05T18:30:00.000Z');
    schedule.completedRevisions = schedule.completedRevisions.filter(rev => rev.date.getTime() === april5Date.getTime());

    console.log(`   After filtering, completed revisions: ${schedule.completedRevisions.length}`);

    // Set currentRevisionIndex to 1 (first pending after April 5)
    schedule.currentRevisionIndex = 1;
    schedule.overdueCount = 0;
    schedule.status = 'active';

    await schedule.save();
    console.log(`✅ Reverted schedule: now currentRevisionIndex=1, pending indices 1-4`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

run();