const User = require('../../models/User');
const heatmapService = require('../heatmap.service');
const { updateUserActivity } = require('../user.service');
const { parseDate } = require('../../utils/helpers/date');

const handleTimeThresholdReached = async (job) => {
  const { userId, questionId, minutesSpent, date } = job.data;
  const activityDate = parseDate(date);

  try {
    const user = await User.findById(userId).select('preferences.timezone');
    if (!user) throw new Error(`User ${userId} not found`);
    const timeZone = user.preferences?.timezone || 'UTC';

    await updateUserActivity(userId, activityDate, timeZone);

    const increments = {
      totalActivities: 1,
      totalTimeSpentMinutes: minutesSpent,
      timeSpentEvents: 1,
    };

    await heatmapService.incrementDailyActivity({
      userId,
      date: activityDate,
      timeZone,
      increments,
    });
  } catch (error) {
    console.error('Error handling time.threshold_reached:', error);
    throw error;
  }
};

module.exports = { handleTimeThresholdReached };