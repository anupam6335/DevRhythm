const ActivityLog = require('../models/ActivityLog');
const Follow = require('../models/Follow'); // <-- ADD THIS LINE
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const { getStartOfDay, getEndOfDay } = require('../utils/helpers/date');
const AppError = require('../utils/errors/AppError');

/**
 * Get activity logs for the authenticated user
 */
const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { action, startDate, endDate, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;

    const query = { userId: req.user._id };
    if (action) query.action = action;
    if (startDate) query.timestamp = { $gte: getStartOfDay(new Date(startDate)) };
    if (endDate) query.timestamp = { ...query.timestamp, $lte: getEndOfDay(new Date(endDate)) };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('targetId') // populate based on targetModel? we'll keep generic
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.json(formatResponse('Activity logs retrieved successfully', { logs }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity feed from followed users (optional feature)
 */
const getActivityFeed = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const following = await Follow.find({ followerId: req.user._id, isActive: true }).distinct('followedId');
    if (following.length === 0) {
      return res.json(formatResponse('No activity from followed users', { logs: [] }));
    }

    const logs = await ActivityLog.find({ userId: { $in: following } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username displayName avatarUrl')
      .populate('targetId')
      .lean();

    const total = await ActivityLog.countDocuments({ userId: { $in: following } });

    res.json(formatResponse('Activity feed retrieved successfully', { logs }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getActivityFeed
};