const ActivityLog = require('../models/ActivityLog');
const Follow = require('../models/Follow');
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
    const timeZone = req.userTimeZone; 

    const query = { userId: req.user._id };
    if (action) query.action = action;
    if (startDate) {
      const start = getStartOfDay(new Date(startDate), timeZone);
      query.timestamp = { $gte: start };
    }
    if (endDate) {
      const end = getEndOfDay(new Date(endDate), timeZone);
      query.timestamp = { ...query.timestamp, $lte: end };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('targetId')
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
    // No date filtering in feed, so timezone not needed here
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