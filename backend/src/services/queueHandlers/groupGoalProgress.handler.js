const ActivityLog = require('../../models/ActivityLog');
const HeatmapData = require('../../models/HeatmapData');
const heatmapService = require('../heatmap.service');
const { updateUserActivity } = require('../user.service');
const { invalidateCache } = require('../../middleware/cache');
const { parseDate } = require('../../utils/helpers/date');

const handleGroupGoalProgress = async (job) => {
  const { userId, groupId, goalId, delta, newProgress, target, timestamp } = job.data;
  const activityDate = parseDate(timestamp || new Date());

  try {
    await updateUserActivity(userId, activityDate);

    const year = activityDate.getFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (!heatmap) {
      heatmap = await heatmapService.generateHeatmapData(userId, year);
    }
    if (heatmap) {
      const dayEntry = heatmap.dailyData.find(
        (d) => new Date(d.date).toDateString() === activityDate.toDateString()
      );
      if (dayEntry) {
        dayEntry.studyGroupActivity += 1;
        dayEntry.totalActivities += 1;
        dayEntry.intensityLevel = Math.min(4, Math.floor(dayEntry.totalActivities / 3));
      }
      heatmap.lastUpdated = new Date();
      await heatmap.save();
      await invalidateCache(`heatmap:${userId}:${year}:*`);
    }

    await ActivityLog.create({
      userId,
      action: 'group_goal_progress',
      targetId: groupId,
      targetModel: 'StudyGroup',
      metadata: {
        goalId,
        delta,
        newProgress,
        target
      },
      timestamp: activityDate,
    });

    console.log(`Group goal progress processed for user ${userId}`);
  } catch (error) {
    console.error('Error in groupGoalProgress handler:', error);
    throw error;
  }
};

module.exports = { handleGroupGoalProgress };