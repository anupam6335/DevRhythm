require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const Queue = require('bull');
const config = require('../src/config');
const RevisionSchedule = require('../src/models/RevisionSchedule');
const UserQuestionProgress = require('../src/models/UserQuestionProgress');

// --- Redis options for Bull queue ---
const redisOptions = (() => {
  if (!config.redis.url) {
    console.error('❌ REDIS_URL not defined');
    return null;
  }
  try {
    const url = new URL(config.redis.url);
    const host = url.hostname;
    const port = parseInt(url.port) || 6379;
    const db = config.redis.db || 0;
    const password = config.redis.password || (url.password ? decodeURIComponent(url.password) : undefined);
    return { host, port, password, db };
  } catch (err) {
    console.error('Invalid Redis URL:', err);
    return null;
  }
})();

if (!redisOptions) {
  console.error('Cannot proceed – Redis configuration missing');
  process.exit(1);
}

const jobQueue = new Queue('devrhythm-jobs', { redis: redisOptions });
const userId = '697efe3dba24d7bc28d1f7aa';
const questionId = '69d80617a8c4cbd079657338';
const completedDate = new Date('2026-04-10T18:30:00.000Z');
const completedAt = new Date('2026-04-23T10:30:26.613Z');

async function cleanQueue() {
  console.log('Cleaning Bull queue...');
  const removedWaiting = await jobQueue.clean(0, 'wait');
  const removedActive = await jobQueue.clean(0, 'active');
  const removedDelayed = await jobQueue.clean(0, 'delayed');
  console.log(`Removed: ${removedWaiting.length} waiting, ${removedActive.length} active, ${removedDelayed.length} delayed`);
  await jobQueue.close();
}

async function restoreData() {
  console.log('Restoring revision schedule and user progress...');

  const revision = await RevisionSchedule.findOne({ userId, questionId });
  if (!revision) {
    console.error('Revision schedule not found');
    return false;
  }

  // Reset completed revisions – only the first one
  revision.completedRevisions = [
    {
      date: completedDate,
      completedAt: completedAt,
      status: 'completed',
      timeSpent: 1345,
      confidenceAfter: 4,
      overdueCompleted: true,
      skipped: false,
      outOfOrder: false,
    }
  ];
  revision.currentRevisionIndex = 1;
  revision.status = 'active';
  revision.overdueCount = 0;
  revision.updatedAt = new Date();
  await revision.save();
  console.log('✅ Revision schedule: first revision completed, index = 1');

  const progress = await UserQuestionProgress.findOne({ userId, questionId });
  if (progress) {
    progress.revisionCount = 1;
    progress.lastRevisedAt = completedAt;
    progress.confidenceLevel = 4;
    if (progress.status === 'Mastered') progress.status = 'Solved';
    // Clear cooldown timestamps
    progress.lastTimeTriggeredAt = null;
    progress.lastRevisionCompletedAt = null;
    await progress.save();
    console.log('✅ User progress: revisionCount=1, status=Solved, confidence=4, cooldowns cleared');
  }

  return true;
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await cleanQueue();
    const restored = await restoreData();

    if (restored) {
      console.log('\nCurrent state:');
      const revision = await RevisionSchedule.findOne({ userId, questionId });
      const now = new Date();
      for (let i = 0; i < revision.schedule.length; i++) {
        const due = revision.schedule[i];
        let label;
        if (i < revision.currentRevisionIndex) label = 'Completed';
        else if (due < now) label = 'Overdue';
        else if (due.toDateString() === now.toDateString()) label = 'Pending';
        else label = 'Upcoming';
        console.log(`  ${i}: ${due.toISOString()} → ${label}`);
      }
    }

    console.log('\n✅ Full restoration completed. No pending queue jobs remain.');
    process.exit(0);
  } catch (error) {
    console.error('Restoration failed:', error);
    process.exit(1);
  }
}

run();