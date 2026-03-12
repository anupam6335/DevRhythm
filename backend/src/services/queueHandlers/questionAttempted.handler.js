const HeatmapData = require('../../models/HeatmapData');
const User = require('../../models/User');
const { invalidateCache } = require('../../middleware/cache');
const heatmapService = require('../heatmap.service');
const { parseDate } = require('../../utils/helpers/date');

const handleQuestionAttempted = async (job) => {
  const { userId, questionId, progressId, timeSpent = 0, attemptedAt } = job.data;

  const attemptDate = parseDate(attemptedAt);
  if (isNaN(attemptDate.getTime())) {
    throw new Error(`Invalid attemptedAt date: ${attemptedAt}`);
  }

  console.log(`[question.attempted] Started for user ${userId}, question ${questionId}`);

  try {
    // --- Update user streak and active days ---
    const today = new Date();
    const todayStr = today.toDateString();
    const user = await User.findById(userId);
    if (user) {
      const lastActive = user.streak.lastActiveDate ? new Date(user.streak.lastActiveDate).toDateString() : null;
      if (!lastActive) {
        user.streak.current = 1;
        user.streak.longest = 1;
        user.stats.activeDays = 1;
      } else if (lastActive !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive === yesterday.toDateString()) {
          user.streak.current += 1;
          if (user.streak.current > user.streak.longest) user.streak.longest = user.streak.current;
        } else {
          user.streak.current = 1;
        }
        user.stats.activeDays += 1;
      }
      user.streak.lastActiveDate = today;
      await user.save();
      await invalidateCache(`user:${userId}:profile`);
    }

    // --- Update heatmap ---
    const year = attemptDate.getFullYear();
    let heatmap = await HeatmapData.findOne({ userId, year });
    if (!heatmap) {
      heatmap = await heatmapService.generateHeatmapData(userId, year);
    }
    if (heatmap) {
      const dayEntry = heatmap.dailyData.find(d => new Date(d.date).toDateString() === attemptDate.toDateString());
      if (dayEntry) {
        dayEntry.totalActivities += 1;
        dayEntry.totalSubmissions += 1;               // track total submissions
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