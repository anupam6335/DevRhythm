// src/services/queueHandlers/timeThresholdReached.handler.js
const User = require('../../models/User');
const heatmapService = require('../heatmap.service');
const { updateUserActivity } = require('../user.service');
const { parseDate } = require('../../utils/helpers/date');

const handleTimeThresholdReached = async (job) => {
  const { userId, questionId, minutesSpent, date } = job.data;
  const activityDate = parseDate(date);

  try {
    // Fetch user timezone
    const user = await User.findById(userId).select('preferences.timezone');
    if (!user) throw new Error(`User ${userId} not found`);
    const timeZone = user.preferences?.timezone || 'UTC';

    // 1. Update user streak and active days
    await updateUserActivity(userId, activityDate, timeZone);

    // 2. Increment heatmap for this day (time‑spent activity)
    //    Note: Only one increment per day per question, even if time >20 min multiple times.
    await heatmapService.incrementDailyActivity({
      userId,
      date: activityDate,
      timeZone,
      increments: {
        totalActivities: 1,
        totalTimeSpentMinutes: minutesSpent, // optional: track total minutes
        timeSpentEvents: 1,                  // optional: count of threshold events
      },
    });

    console.log(`[time.threshold_reached] Processed for user ${userId}, minutes=${minutesSpent}`);
  } catch (error) {
    console.error('Error handling time.threshold_reached:', error);
    throw error;
  }
};

module.exports = { handleTimeThresholdReached };