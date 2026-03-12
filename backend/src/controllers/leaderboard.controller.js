const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const leaderboardService = require('../services/leaderboard.service');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const { getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } = require('../utils/helpers/date');
const AppError = require('../utils/errors/AppError');

/**
 * Get leaderboard by type (weekly/monthly) and optional period
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { date } = req.query; // optional date to get specific week/month
    const { page, limit } = getPaginationParams(req);

    if (!['weekly', 'monthly'].includes(type)) {
      throw new AppError('Invalid leaderboard type', 400);
    }

    let periodStart, periodEnd;
    const referenceDate = date ? new Date(date) : new Date();
    if (type === 'weekly') {
      periodStart = getStartOfWeek(referenceDate);
      periodEnd = getEndOfWeek(referenceDate);
    } else {
      periodStart = getStartOfMonth(referenceDate);
      periodEnd = getEndOfMonth(referenceDate);
    }

    let snapshot = await LeaderboardSnapshot.findOne({
      leaderboardType: type,
      periodStart,
      periodEnd
    }).populate('rankings.userId', 'username displayName avatarUrl').lean();

    if (!snapshot) {
      // Calculate on the fly and store
      snapshot = await leaderboardService.calculateLeaderboard(type, periodStart, periodEnd);
    }

    // Paginate rankings
    const start = (page - 1) * limit;
    const paginatedRankings = snapshot.rankings.slice(start, start + limit);
    const total = snapshot.rankings.length;

    res.json(formatResponse('Leaderboard retrieved successfully', {
      leaderboardType: type,
      periodStart,
      periodEnd,
      rankings: paginatedRankings
    }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's rank on the leaderboard
 */
const getUserRank = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { date } = req.query;
    if (!['weekly', 'monthly'].includes(type)) {
      throw new AppError('Invalid leaderboard type', 400);
    }

    const referenceDate = date ? new Date(date) : new Date();
    const periodStart = type === 'weekly' ? getStartOfWeek(referenceDate) : getStartOfMonth(referenceDate);
    const periodEnd = type === 'weekly' ? getEndOfWeek(referenceDate) : getEndOfMonth(referenceDate);

    let snapshot = await LeaderboardSnapshot.findOne({ leaderboardType: type, periodStart, periodEnd });
    if (!snapshot) {
      snapshot = await leaderboardService.calculateLeaderboard(type, periodStart, periodEnd);
    }

    const userRankEntry = snapshot.rankings.find(r => r.userId.toString() === req.user._id.toString());
    if (!userRankEntry) {
      return res.json(formatResponse('User not ranked in this period', { rank: null }));
    }

    res.json(formatResponse('User rank retrieved', { rank: userRankEntry }));
  } catch (error) {
    next(error);
  }
};

/**
 * Manually trigger leaderboard recalculation (admin only maybe)
 */
const refreshLeaderboard = async (req, res, next) => {
  try {
    const { type } = req.params;
    const { date } = req.query;
    if (!['weekly', 'monthly'].includes(type)) {
      throw new AppError('Invalid leaderboard type', 400);
    }

    const referenceDate = date ? new Date(date) : new Date();
    const periodStart = type === 'weekly' ? getStartOfWeek(referenceDate) : getStartOfMonth(referenceDate);
    const periodEnd = type === 'weekly' ? getEndOfWeek(referenceDate) : getEndOfMonth(referenceDate);

    const snapshot = await leaderboardService.calculateLeaderboard(type, periodStart, periodEnd, true); // force recalc
    res.json(formatResponse('Leaderboard refreshed', { snapshot }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  getUserRank,
  refreshLeaderboard
};