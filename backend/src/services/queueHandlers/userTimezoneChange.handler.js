const { DateTime } = require('luxon');
const RevisionSchedule = require('../../models/RevisionSchedule');
const Goal = require('../../models/Goal');
const ProgressSnapshot = require('../../models/ProgressSnapshot');
const HeatmapData = require('../../models/HeatmapData');
const heatmapService = require('../heatmap.service');

const handleUserTimezoneChange = async (job) => {
  const { userId, oldTimezone, newTimezone } = job.data;

  // 1. RevisionSchedule: shift schedule dates to preserve original local dates
  const revisions = await RevisionSchedule.find({ userId });
  for (const rev of revisions) {
    const newSchedule = rev.schedule.map(utcDate => {
      const localInOld = DateTime.fromJSDate(utcDate, { zone: oldTimezone });
      const newUtc = localInOld.setZone(newTimezone, { keepLocalTime: true }).toJSDate();
      return newUtc;
    });
    rev.schedule = newSchedule;
    rev.baseDate = DateTime.fromJSDate(rev.baseDate, { zone: oldTimezone })
      .setZone(newTimezone, { keepLocalTime: true }).toJSDate();

    for (const cr of rev.completedRevisions) {
      cr.date = DateTime.fromJSDate(cr.date, { zone: oldTimezone })
        .setZone(newTimezone, { keepLocalTime: true }).toJSDate();
      // completedAt is absolute – leave unchanged
    }
    await rev.save();
  }

  // 2. Goals: shift startDate, endDate, achievedAt, completedAt
  const goals = await Goal.find({ userId });
  for (const goal of goals) {
    goal.startDate = DateTime.fromJSDate(goal.startDate, { zone: oldTimezone })
      .setZone(newTimezone, { keepLocalTime: true }).toJSDate();
    goal.endDate = DateTime.fromJSDate(goal.endDate, { zone: oldTimezone })
      .setZone(newTimezone, { keepLocalTime: true }).toJSDate();
    if (goal.achievedAt) {
      goal.achievedAt = DateTime.fromJSDate(goal.achievedAt, { zone: oldTimezone })
        .setZone(newTimezone, { keepLocalTime: true }).toJSDate();
    }
    if (goal.completedQuestions) {
      for (const cq of goal.completedQuestions) {
        cq.completedAt = DateTime.fromJSDate(cq.completedAt, { zone: oldTimezone })
          .setZone(newTimezone, { keepLocalTime: true }).toJSDate();
      }
    }
    await goal.save();
  }

  // 3. ProgressSnapshot: update snapshotDate
  const snapshots = await ProgressSnapshot.find({ userId });
  for (const snap of snapshots) {
    snap.snapshotDate = DateTime.fromJSDate(snap.snapshotDate, { zone: oldTimezone })
      .setZone(newTimezone, { keepLocalTime: true }).toJSDate();
    await snap.save();
  }

  // 4. HeatmapData: delete and regenerate (most reliable)
  const years = await HeatmapData.distinct('year', { userId });
  await HeatmapData.deleteMany({ userId });
  for (const year of years) {
    await heatmapService.generateHeatmapData(userId, year, newTimezone);
  }

  console.log(`Timezone change completed for user ${userId} (${oldTimezone} → ${newTimezone})`);
};

module.exports = { handleUserTimezoneChange };