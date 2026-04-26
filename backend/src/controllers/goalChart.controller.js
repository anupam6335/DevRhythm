const GoalSnapshotService = require('../services/goalSnapshot.service');
const { formatResponse } = require('../utils/helpers/response');
const AppError = require('../utils/errors/AppError');
const { invalidateCache } = require('../middleware/cache');

const invalidateGoalChartCache = async (userId) => {
  const pattern = `goal-chart:user:${userId}:*`;
  await invalidateCache(pattern);
};

const getGoalChartData = async (req, res, next) => {
  try {
    const { periodType, range, includeComparison } = req.query;
    const timeZone = req.userTimeZone || 'UTC';
    const userId = req.user._id;

    if (periodType && !['monthly', 'yearly'].includes(periodType)) {
      throw new AppError('periodType must be "monthly" or "yearly"', 400);
    }
    const effectivePeriodType = periodType || 'monthly';

    let year = null;
    let months = 12;
    if (range) {
      if (range === 'last12months') {
        // use default
      } else if (range.startsWith('year=')) {
        const parsedYear = parseInt(range.split('=')[1], 10);
        if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
          throw new AppError('Invalid year format. Use year=YYYY', 400);
        }
        year = parsedYear;
      } else {
        throw new AppError('range must be "last12months" or "year=YYYY"', 400);
      }
    }

    const includeComparisonFlag = includeComparison !== 'false';

    const chartData = await GoalSnapshotService.getChartData(userId, effectivePeriodType, {
      year,
      months,
      includeComparison: includeComparisonFlag,
      timeZone,
    });

    if (chartData.comparison) {
      const userAhead = chartData.user.goalsCompleted.map((val, idx) => {
        const avg = chartData.comparison.avgGoalsCompleted[idx];
        return val > avg;
      });
      chartData.comparison.userAhead = userAhead;
    }

    res.json(formatResponse('Goal chart data retrieved successfully', chartData));
  } catch (error) {
    next(error);
  }
};

const refreshUserSnapshots = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const timeZone = req.userTimeZone || 'UTC';
    const monthsBack = parseInt(req.body.monthsBack, 10) || 12;

    await GoalSnapshotService.backfillUserSnapshots(userId, timeZone, monthsBack);
    await invalidateGoalChartCache(userId);

    res.json(formatResponse('User goal snapshots refreshed successfully', {
      userId,
      monthsBackfilled: monthsBack,
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoalChartData,
  refreshUserSnapshots,
};