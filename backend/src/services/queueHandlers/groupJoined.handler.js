const ActivityLog = require('../../models/ActivityLog');
const HeatmapData = require('../../models/HeatmapData');
const heatmapService = require('../heatmap.service');
const { updateUserActivity } = require('../user.service');
const { invalidateCache } = require('../../middleware/cache');
const { parseDate } = require('../../utils/helpers/date');

const handleGroupJoined = async (job) => {
  const { userId, groupId, groupName, timestamp } = job.data;
  const activityDate = parseDate(timestamp || new Date());

  try {
    // 1. Update streak and active days
    await updateUserActivity(userId, activityDate);

    // 2. Update heatmap (studyGroupActivity)
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

    // 3. Create activity log
    await ActivityLog.create({
      userId,
      action: 'joined_group',
      targetId: groupId,
      targetModel: 'StudyGroup',
      metadata: { groupName },
      timestamp: activityDate,
    });

    console.log(`Group joined processed for user ${userId}`);
  } catch (error) {
    console.error('Error in groupJoined handler:', error);
    throw error;
  }
};

module.exports = { handleGroupJoined };