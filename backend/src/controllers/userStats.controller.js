const User = require('../models/User');
const { formatResponse } = require('../utils/helpers/response');
const AppError = require('../utils/errors/AppError');

/**
 * Get detailed statistics for the current user (including breakdowns)
 */
const getUserDetailedStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate progress by difficulty and platform
    const progress = await UserQuestionProgress.aggregate([
      { $match: { userId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: '$question' },
      {
        $group: {
          _id: null,
          totalSolved: { $sum: { $cond: [{ $in: ['$status', ['Solved', 'Mastered']] }, 1, 0] } },
          totalMastered: { $sum: { $cond: [{ $eq: ['$status', 'Mastered'] }, 1, 0] } },
          byDifficulty: {
            $push: {
              difficulty: '$question.difficulty',
              status: '$status'
            }
          },
          byPlatform: {
            $push: {
              platform: '$question.platform',
              status: '$status'
            }
          }
        }
      }
    ]);

    const stats = progress[0] || { totalSolved: 0, totalMastered: 0, byDifficulty: [], byPlatform: [] };

    // Build breakdown objects
    const difficultyBreakdown = { Easy: { solved: 0, mastered: 0 }, Medium: { solved: 0, mastered: 0 }, Hard: { solved: 0, mastered: 0 } };
    stats.byDifficulty.forEach(item => {
      if (item.status === 'Solved' || item.status === 'Mastered') {
        difficultyBreakdown[item.difficulty].solved++;
        if (item.status === 'Mastered') difficultyBreakdown[item.difficulty].mastered++;
      }
    });

    const platformBreakdown = {};
    stats.byPlatform.forEach(item => {
      if (item.status === 'Solved' || item.status === 'Mastered') {
        platformBreakdown[item.platform] = (platformBreakdown[item.platform] || 0) + 1;
      }
    });

    // Get user streak and other info
    const user = await User.findById(userId).select('streak stats preferences');
    const detailedStats = {
      totalSolved: stats.totalSolved,
      totalMastered: stats.totalMastered,
      masteryRate: user.stats.masteryRate,
      streak: user.streak,
      activeDays: user.stats.activeDays,
      totalTimeSpent: user.stats.totalTimeSpent,
      totalRevisions: user.stats.totalRevisions,
      difficultyBreakdown,
      platformBreakdown,
      preferences: user.preferences
    };

    res.json(formatResponse('Detailed user statistics retrieved', { stats: detailedStats }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get public stats for another user (with more fields but exclude sensitive ones)
 */
const getPublicUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .select('-email -providerId -preferences -authProvider -__v')
      .lean();
    if (!user) throw new AppError('User not found', 404);
    if (user.privacy !== 'public') throw new AppError('User stats are private', 403);

    // Compute isOnline
    user.isOnline = (Date.now() - new Date(user.lastOnline).getTime()) < 5 * 60 * 1000;

    // Round masteryRate
    if (user.stats && user.stats.masteryRate) {
      user.stats.masteryRate = Math.round(user.stats.masteryRate * 100) / 100;
    }

    res.json(formatResponse('Public user stats retrieved', { user }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDetailedStats,
  getPublicUserStats
};