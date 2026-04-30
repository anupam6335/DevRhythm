const cron = require('cron');
const RevisionSchedule = require('../models/RevisionSchedule');
const { getStartOfDay } = require('../utils/helpers/date');

/**
 * Cron job to update overdue revisions:
 * - Advances currentRevisionIndex to the first schedule date >= today.
 * - Does NOT add any completedRevisions entries.
 * - Updates overdueCount, status, overdueActive based on the new pending date.
 *
 * Runs every hour.
 */
const updateOverdueRevisions = async () => {
  try {
    const todayStart = getStartOfDay(new Date(), 'UTC');
    const schedules = await RevisionSchedule.find({
      status: { $in: ['active', 'overdue'] },
      $expr: {
        $and: [
          { $lt: ['$currentRevisionIndex', { $size: '$schedule' }] },
          { $lt: [{ $arrayElemAt: ['$schedule', '$currentRevisionIndex'] }, todayStart] }
        ]
      }
    });

    let updatedCount = 0;
    for (const rev of schedules) {
      // Find first index where schedule date >= todayStart
      let newIndex = rev.currentRevisionIndex;
      for (let i = rev.currentRevisionIndex; i < rev.schedule.length; i++) {
        if (rev.schedule[i] >= todayStart) {
          newIndex = i;
          break;
        }
      }
      // If all remaining dates are < today, keep the last index
      if (newIndex === rev.currentRevisionIndex && rev.schedule[rev.currentRevisionIndex] < todayStart) {
        newIndex = rev.schedule.length - 1;
      }

      rev.currentRevisionIndex = newIndex;

      // Recalculate state based on the new pending date
      if (rev.currentRevisionIndex < rev.schedule.length) {
        const pendingDue = rev.schedule[rev.currentRevisionIndex];
        const daysOverdue = Math.floor((todayStart - pendingDue) / (1000 * 60 * 60 * 24));
        rev.overdueCount = daysOverdue > 0 ? daysOverdue : 0;
        rev.overdueActive = daysOverdue > 0;
        rev.status = daysOverdue > 0 ? 'overdue' : 'active';
      } else {
        rev.status = 'completed';
        rev.overdueActive = false;
        rev.overdueCount = 0;
      }

      rev.updatedAt = new Date();
      await rev.save();
      updatedCount++;
    }

    if (updatedCount > 0) {
      console.log(`[OverdueRevisions] Advanced index for ${updatedCount} schedules (no auto‑completion)`);
    }
  } catch (error) {
    console.error('[OverdueRevisions] Job failed:', error);
  }
};

// Schedule every hour at minute 0
const overdueJob = new cron.CronJob('0 * * * *', updateOverdueRevisions);

const startOverdueRevisionsJob = () => {
  overdueJob.start();
  console.log('Overdue revisions cron job started (every hour) – index auto‑advance only');
};

const stopOverdueRevisionsJob = () => {
  overdueJob.stop();
  console.log('Overdue revisions cron job stopped');
};

module.exports = {
  startOverdueRevisionsJob,
  stopOverdueRevisionsJob,
  updateOverdueRevisions,
};