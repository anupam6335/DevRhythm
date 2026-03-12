const ProgressSnapshot = require('../models/ProgressSnapshot');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const { getStartOfDay, getEndOfDay } = require('../utils/helpers/date');
const AppError = require('../utils/errors/AppError');

/**
 * Get progress snapshots for the user filtered by period and date range
 */
const getSnapshots = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { period, startDate, endDate } = req.query;

    const query = { userId: req.user._id };
    if (period) query.snapshotPeriod = period;
    if (startDate) query.snapshotDate = { $gte: getStartOfDay(new Date(startDate)) };
    if (endDate) query.snapshotDate = { ...query.snapshotDate, $lte: getEndOfDay(new Date(endDate)) };

    const [snapshots, total] = await Promise.all([
      ProgressSnapshot.find(query)
        .sort({ snapshotDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProgressSnapshot.countDocuments(query)
    ]);

    res.json(formatResponse('Progress snapshots retrieved', { snapshots }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get the latest snapshot for a given period
 */
const getLatestSnapshot = async (req, res, next) => {
  try {
    const { period } = req.params;
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      throw new AppError('Invalid period. Must be daily, weekly, or monthly', 400);
    }

    const snapshot = await ProgressSnapshot.findOne({
      userId: req.user._id,
      snapshotPeriod: period
    }).sort({ snapshotDate: -1 }).lean();

    if (!snapshot) throw new AppError(`No ${period} snapshot found`, 404);

    res.json(formatResponse('Latest snapshot retrieved', { snapshot }));
  } catch (error) {
    next(error);
  }
};

/**
 * Manually trigger snapshot generation for a period (optional)
 */
const refreshSnapshot = async (req, res, next) => {
  try {
    const { period } = req.body;
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      throw new AppError('Invalid period', 400);
    }

    // This could call a service method to generate snapshot
    // For now, just acknowledge
    res.json(formatResponse('Snapshot refresh triggered', { period }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSnapshots,
  getLatestSnapshot,
  refreshSnapshot
};