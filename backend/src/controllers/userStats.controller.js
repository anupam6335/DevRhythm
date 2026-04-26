const mongoose = require('mongoose');
const User = require('../models/User');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const { formatResponse } = require('../utils/helpers/response');
const AppError = require('../utils/errors/AppError');

/**
 * Helper function to compute detailed stats for a given user.
 * Returns totalSolved, totalMastered, difficultyBreakdown, and platformBreakdown.
 */
const computeDetailedStats = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    { $match: { userId: objectId } },
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
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalSolved: { $sum: { $cond: [{ $in: ['$status', ['Solved', 'Mastered']] }, 1, 0] } },
              totalMastered: { $sum: { $cond: [{ $eq: ['$status', 'Mastered'] }, 1, 0] } }
            }
          }
        ],
        difficultyBreakdown: [
          {
            $match: { $or: [{ status: 'Solved' }, { status: 'Mastered' }] }
          },
          {
            $group: {
              _id: '$question.difficulty',
              solved: { $sum: 1 },
              mastered: { $sum: { $cond: [{ $eq: ['$status', 'Mastered'] }, 1, 0] } }
            }
          }
        ],
        platformBreakdown: [
          {
            $match: { $or: [{ status: 'Solved' }, { status: 'Mastered' }] }
          },
          {
            $group: {
              _id: '$question.platform',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ];

  const results = await UserQuestionProgress.aggregate(pipeline);
  const data = results[0];

  const totals = data.totals[0] || { totalSolved: 0, totalMastered: 0 };

  const difficultyBreakdown = {
    Easy: { solved: 0, mastered: 0 },
    Medium: { solved: 0, mastered: 0 },
    Hard: { solved: 0, mastered: 0 }
  };
  data.difficultyBreakdown.forEach(item => {
    const diff = item._id;
    if (difficultyBreakdown[diff]) {
      difficultyBreakdown[diff].solved = item.solved;
      difficultyBreakdown[diff].mastered = item.mastered;
    }
  });

  const platformBreakdown = {};
  data.platformBreakdown.forEach(item => {
    platformBreakdown[item._id] = item.count;
  });

  return {
    totalSolved: totals.totalSolved,
    totalMastered: totals.totalMastered,
    difficultyBreakdown,
    platformBreakdown
  };
};

/**
 * Get detailed statistics for the current user (including breakdowns)
 */
const getUserDetailedStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const computed = await computeDetailedStats(userId);

    const user = await User.findById(userId).select('streak stats preferences');
    const detailedStats = {
      ...computed,
      masteryRate: user.stats.masteryRate,
      streak: user.streak,
      activeDays: user.stats.activeDays,
      totalTimeSpent: user.stats.totalTimeSpent,
      totalRevisions: user.stats.totalRevisions,
      preferences: user.preferences
    };

    res.json(formatResponse('Detailed user statistics retrieved', { stats: detailedStats }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get public stats for another user (rich details, minimal fields)
 */
const getPublicUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-email -providerId -preferences -authProvider -__v')
      .lean();
    if (!user) throw new AppError('User not found', 404);
    if (user.privacy !== 'public') throw new AppError('User stats are private', 403);

    const computed = await computeDetailedStats(userId);

    const publicStats = {
      totalSolved: computed.totalSolved,
      totalMastered: computed.totalMastered,
      masteryRate: user.stats.masteryRate,
      streak: user.streak,
      activeDays: user.stats.activeDays,
      totalTimeSpent: user.stats.totalTimeSpent,
      totalRevisions: user.stats.totalRevisions,
      difficultyBreakdown: computed.difficultyBreakdown,
      platformBreakdown: computed.platformBreakdown
    };

    if (publicStats.masteryRate) {
      publicStats.masteryRate = Math.round(publicStats.masteryRate * 100) / 100;
    }

    res.json(formatResponse('Public user stats retrieved', {
      stats: publicStats,
      userId: user._id
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserDetailedStats,
  getPublicUserStats
};