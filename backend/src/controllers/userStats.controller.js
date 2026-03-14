const UserStats = require('../models/UserStats');
const User = require('../models/User');
const { jobQueue } = require('../services/queue.service');
const { client: redisClient } = require('../config/redis');
const { formatResponse } = require('../utils/helpers/response');
const AppError = require('../utils/errors/AppError');

// Helper to check if stats need refresh
const isStatsStale = (lastUpdated) => {
  const oneHour = 60 * 60 * 1000;
  return !lastUpdated || (Date.now() - new Date(lastUpdated).getTime()) > oneHour;
};

// Helper to enqueue a stats update
const enqueueStatsUpdate = async (userId) => {
  const jobId = `stats_${userId}_${Date.now()}`;
  await jobQueue.add({
    type: 'user-stats.update',
    userId
  });
  return jobId;
};

/**
 * Get detailed statistics for the current user
 */
const getUserDetailedStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let stats = await UserStats.findOne({ userId }).lean();

    if (!stats || isStatsStale(stats.lastUpdated)) {
      // Enqueue an update in background
      const jobId = await enqueueStatsUpdate(userId);
      // If stats exist, return them with a warning
      if (stats) {
        res.set('X-Stats-Stale', 'true');
        res.set('X-Stats-Job-Id', jobId);
        return res.json(formatResponse('Detailed user statistics retrieved (stale)', { stats }));
      } else {
        // No stats yet – return 202 with job ID
        return res.status(202).json({
          success: true,
          statusCode: 202,
          message: 'Statistics are being generated. Please try again shortly.',
          data: null,
          meta: { jobId }
        });
      }
    }

    // Merge with user data for streak and preferences if needed
    const user = await User.findById(userId).select('streak preferences');
    const response = {
      ...stats,
      streak: user.streak,
      preferences: user.preferences
    };

    res.json(formatResponse('Detailed user statistics retrieved', { stats: response }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get public stats for another user
 */
const getPublicUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('username displayName avatarUrl privacy streak stats')
      .lean();
    if (!user) throw new AppError('User not found', 404);
    if (user.privacy !== 'public') throw new AppError('User stats are private', 403);

    let stats = await UserStats.findOne({ userId }).lean();

    if (!stats || isStatsStale(stats.lastUpdated)) {
      const jobId = await enqueueStatsUpdate(userId);
      if (stats) {
        res.set('X-Stats-Stale', 'true');
        res.set('X-Stats-Job-Id', jobId);
        // Return public stats (strip preferences)
        const publicStats = {
          totalSolved: stats.totalSolved,
          totalMastered: stats.totalMastered,
          masteryRate: stats.masteryRate,
          streak: user.streak,
          activeDays: user.stats.activeDays,
          totalTimeSpent: stats.totalTimeSpent,
          totalRevisions: stats.totalRevisions,
          difficultyBreakdown: stats.byDifficulty,
          platformBreakdown: stats.byPlatform
        };
        return res.json(formatResponse('Public user stats retrieved (stale)', { stats: publicStats, userId }));
      } else {
        return res.status(202).json({
          success: true,
          statusCode: 202,
          message: 'Public statistics are being generated. Please try again shortly.',
          data: null,
          meta: { jobId }
        });
      }
    }

    const publicStats = {
      totalSolved: stats.totalSolved,
      totalMastered: stats.totalMastered,
      masteryRate: stats.masteryRate,
      streak: user.streak,
      activeDays: user.stats.activeDays,
      totalTimeSpent: stats.totalTimeSpent,
      totalRevisions: stats.totalRevisions,
      difficultyBreakdown: stats.byDifficulty,
      platformBreakdown: stats.byPlatform
    };

    res.json(formatResponse('Public user stats retrieved', { stats: publicStats, userId }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDetailedStats,
  getPublicUserStats
};