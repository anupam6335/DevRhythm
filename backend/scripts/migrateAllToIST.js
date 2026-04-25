const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { DateTime } = require('luxon');
const User = require('../src/models/User');
const RevisionSchedule = require('../src/models/RevisionSchedule');
const Goal = require('../src/models/Goal');
const ProgressSnapshot = require('../src/models/ProgressSnapshot');
const HeatmapData = require('../src/models/HeatmapData');
const heatmapService = require('../src/services/heatmap.service');
const { client: redisClient, waitForRedis } = require('../src/config/redis');

function shiftDatePreservingLocal(date, oldTz, newTz) {
  if (!date) return date;
  const dt = DateTime.fromJSDate(date, { zone: oldTz });
  const local = dt.setZone(newTz, { keepLocalTime: true });
  return local.toJSDate();
}

async function migrateUser(user, targetTz = 'Asia/Kolkata') {
  console.log(`\n🔄 Processing user: ${user.email} (${user._id})`);

  const oldTz = 'UTC';
  let anyChange = false;

  // 1. RevisionSchedule
  const revisions = await RevisionSchedule.find({ userId: user._id });
  for (const rev of revisions) {
    let changed = false;
    const newSchedule = rev.schedule.map(d => shiftDatePreservingLocal(d, oldTz, targetTz));
    if (JSON.stringify(newSchedule) !== JSON.stringify(rev.schedule)) {
      rev.schedule = newSchedule;
      changed = true;
    }
    const newBaseDate = shiftDatePreservingLocal(rev.baseDate, oldTz, targetTz);
    if (newBaseDate.getTime() !== rev.baseDate.getTime()) {
      rev.baseDate = newBaseDate;
      changed = true;
    }
    for (const cr of rev.completedRevisions) {
      const newCrDate = shiftDatePreservingLocal(cr.date, oldTz, targetTz);
      if (newCrDate.getTime() !== cr.date.getTime()) {
        cr.date = newCrDate;
        changed = true;
      }
    }
    if (changed) {
      await rev.save();
      console.log(`  ✓ Updated revision schedule ${rev._id}`);
      anyChange = true;
    }
  }

  // 2. Goals
  const goals = await Goal.find({ userId: user._id });
  for (const goal of goals) {
    let changed = false;
    const newStart = shiftDatePreservingLocal(goal.startDate, oldTz, targetTz);
    if (newStart.getTime() !== goal.startDate.getTime()) {
      goal.startDate = newStart;
      changed = true;
    }
    const newEnd = shiftDatePreservingLocal(goal.endDate, oldTz, targetTz);
    if (newEnd.getTime() !== goal.endDate.getTime()) {
      goal.endDate = newEnd;
      changed = true;
    }
    if (goal.achievedAt) {
      const newAchieved = shiftDatePreservingLocal(goal.achievedAt, oldTz, targetTz);
      if (newAchieved.getTime() !== goal.achievedAt.getTime()) {
        goal.achievedAt = newAchieved;
        changed = true;
      }
    }
    for (const cq of goal.completedQuestions || []) {
      if (cq.completedAt) {
        const newCq = shiftDatePreservingLocal(cq.completedAt, oldTz, targetTz);
        if (newCq.getTime() !== cq.completedAt.getTime()) {
          cq.completedAt = newCq;
          changed = true;
        }
      }
    }
    if (changed) {
      await goal.save();
      console.log(`  ✓ Updated goal ${goal._id} (${goal.goalType})`);
      anyChange = true;
    }
  }

  // 3. ProgressSnapshots
  const snapshots = await ProgressSnapshot.find({ userId: user._id });
  for (const snap of snapshots) {
    const newDate = shiftDatePreservingLocal(snap.snapshotDate, oldTz, targetTz);
    if (newDate.getTime() !== snap.snapshotDate.getTime()) {
      snap.snapshotDate = newDate;
      await snap.save();
      console.log(`  ✓ Updated snapshot ${snap._id}`);
      anyChange = true;
    }
  }

  // 4. HeatmapData – delete old, regenerate (requires Redis)
  const years = await HeatmapData.distinct('year', { userId: user._id });
  if (years.length) {
    await HeatmapData.deleteMany({ userId: user._id });
    console.log(`  🗑 Deleted old heatmap data (${years.length} years)`);
    for (const year of years) {
      await heatmapService.generateHeatmapData(user._id, year, targetTz);
      console.log(`  ✓ Regenerated heatmap for year ${year}`);
    }
    anyChange = true;
  }

  // 5. Ensure user timezone is set
  if (!user.preferences) user.preferences = {};
  user.preferences.timezone = targetTz;
  await user.save();

  if (anyChange) {
    console.log(`  ✅ User ${user.email} data shifted from UTC to ${targetTz}`);
  } else {
    console.log(`  ⊘ No date data to shift for user ${user.email}`);
  }
}

async function migrateAllUsers(targetTz = 'Asia/Kolkata', userIdOnly = null) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not defined');

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Connect to Redis (required for heatmap regeneration)
    await waitForRedis();
    console.log('✅ Connected to Redis');

    let query = {};
    if (userIdOnly) {
      query = { _id: userIdOnly };
    } else {
      query = { 'preferences.timezone': targetTz };
    }
    const users = await User.find(query);
    console.log(`📊 Found ${users.length} users with timezone = ${targetTz}`);

    for (const user of users) {
      await migrateUser(user, targetTz);
    }

    console.log('\n✅ Migration complete');
    await mongoose.disconnect();
    if (redisClient) await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (redisClient) await redisClient.quit();
    process.exit(1);
  }
}

// Usage: node scripts/migrateAllToIST.js [--userId <userId>]
const args = process.argv.slice(2);
let userId = null;
if (args[0] === '--userId' && args[1]) {
  userId = args[1];
  console.log(`🔧 Migrating only user: ${userId}`);
  migrateAllUsers('Asia/Kolkata', userId);
} else {
  migrateAllUsers('Asia/Kolkata');
}