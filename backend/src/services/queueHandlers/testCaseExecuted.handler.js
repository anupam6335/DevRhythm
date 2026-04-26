const User = require('../../models/User');
const heatmapService = require('../heatmap.service');
const { updateUserActivity } = require('../user.service');
const { parseDate } = require('../../utils/helpers/date');

const handleTestCaseExecuted = async (job) => {
  const { userId, questionId, passedCount, failedCount, totalTestCases, allPassed, executedAt, language } = job.data;
  const activityDate = parseDate(executedAt);

  try {
    const user = await User.findById(userId).select('preferences.timezone');
    if (!user) throw new Error(`User ${userId} not found`);
    const timeZone = user.preferences?.timezone || 'UTC';

    await updateUserActivity(userId, activityDate, timeZone);

    const increments = {
      totalActivities: 1,
      totalSubmissions: 1,
      testCaseExecutions: totalTestCases,
      passedCount: passedCount,
      failedCount: failedCount,
    };

    await heatmapService.incrementDailyActivity({
      userId,
      date: activityDate,
      timeZone,
      increments,
    });
  } catch (error) {
    console.error('Error handling testCase.executed:', error);
    throw error;
  }
};

module.exports = { handleTestCaseExecuted };