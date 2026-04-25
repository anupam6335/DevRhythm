const HeatmapData = require('../../models/HeatmapData');
const User = require('../../models/User');
const { invalidateCache } = require('../../middleware/cache');
const heatmapService = require('../heatmap.service');
const { parseDate } = require('../../utils/helpers/date');
const { updateUserActivity } = require('../user.service');

const handleQuestionAttempted = async (job) => {
  const { userId, questionId, progressId, timeSpent = 0, attemptedAt } = job.data;

  const attemptDate = parseDate(attemptedAt);
  if (isNaN(attemptDate.getTime())) {
    throw new Error(`Invalid attemptedAt date: ${attemptedAt}`);
  }

  console.log(`[question.attempted] Started for user ${userId}, question ${questionId}`);

  try {
    // Fetch user and timezone
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    const userTimeZone = user.preferences?.timezone || 'UTC';

    // --- Update user streak and active days using user timezone ---
    await updateUserActivity(userId, attemptDate, userTimeZone);

    // --- Update heatmap – create if missing, using user timezone ---
    const year = attemptDate.getUTCFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (!heatmap) {
      heatmap = await heatmapService.generateHeatmapData(userId, year, userTimeZone);
    }
    if (heatmap) {
      const dayEntry = heatmap.dailyData.find(d => new Date(d.date).toDateString() === attemptDate.toDateString());
      if (dayEntry) {
        dayEntry.totalActivities += 1;
        dayEntry.totalSubmissions += 1;
        dayEntry.totalTimeSpent += timeSpent;
        dayEntry.intensityLevel = Math.min(4, Math.floor(dayEntry.totalActivities / 3));
      }
      heatmap.lastUpdated = new Date();
      await heatmap.save();
      await invalidateCache(`heatmap:${userId}:${year}:*`);
    }

    console.log(`[question.attempted] Completed for user ${userId}`);
  } catch (error) {
    console.error(`[question.attempted] Error:`, error);
    throw error;
  }
};

module.exports = { handleQuestionAttempted };