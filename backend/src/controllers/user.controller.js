const User = require('../models/User');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const AppError = require('../utils/errors/AppError');
const { generateToken } = require('../middleware/auth');
const { invalidateUserCache, invalidateDashboardCache } = require('../middleware/cache');
const { paginate } = require('../utils/helpers/pagination');
const { formatResponse } = require('../utils/helpers/response');

const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user.toObject();
    delete user.__v;
    // Online if last activity within 1 minutes
    user.isOnline = (Date.now() - new Date(user.lastOnline).getTime()) < 1 * 60 * 1000;
    
    // Round masteryRate to 2 decimal places
    if (user.stats && user.stats.masteryRate) {
      user.stats.masteryRate = Math.round(user.stats.masteryRate * 100) / 100;
    }
    
    res.json(formatResponse('User profile retrieved successfully', { user }));
  } catch (error) {
    next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const updates = {};
    let dashboardInvalidate = false;
    
    if (req.body.displayName) updates.displayName = req.body.displayName;
    if (req.body.preferences) {
      updates.preferences = req.body.preferences;
      // If dailyGoal or weeklyGoal changed, dashboard needs refresh
      if (req.body.preferences.dailyGoal !== undefined || req.body.preferences.weeklyGoal !== undefined) {
        dashboardInvalidate = true;
      }
    }
    if (req.body.privacy) updates.privacy = req.body.privacy;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-__v');
    
    await invalidateUserCache(req.user._id);
    if (dashboardInvalidate) {
      await invalidateDashboardCache(req.user._id);
    }
    
    // Round masteryRate for response
    if (user.stats && user.stats.masteryRate) {
      user.stats.masteryRate = Math.round(user.stats.masteryRate * 100) / 100;
    }
    
    res.json(formatResponse('User profile updated successfully', { user }));
  } catch (error) {
    next(error);
  }
};

const getUserByUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
      privacy: { $in: ['public', 'link-only'] }
    }).select('-__v -email -authProvider -providerId -preferences -isActive');
    
    if (!user) throw new AppError('User not found or profile is private', 404);
    
    const userObj = user.toObject();
    userObj.isOnline = (Date.now() - new Date(userObj.lastOnline).getTime()) < 1 * 60 * 1000;
    
    // Round masteryRate
    if (userObj.stats && userObj.stats.masteryRate) {
      userObj.stats.masteryRate = Math.round(userObj.stats.masteryRate * 100) / 100;
    }
    
    res.json(formatResponse('User profile retrieved successfully', { user: userObj }));
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const stats = {
      stats: req.user.stats,
      currentStreak: req.user.streak.current,
      longestStreak: req.user.streak.longest,
      followersCount: req.user.followersCount,
      followingCount: req.user.followingCount,
      goals: {
        daily: req.user.preferences.dailyGoal,
        weekly: req.user.preferences.weeklyGoal,
        dailyProgress: 0,
        weeklyProgress: 0
      }
    };
    
    // Round masteryRate if present
    if (stats.stats && stats.stats.masteryRate) {
      stats.stats.masteryRate = Math.round(stats.stats.masteryRate * 100) / 100;
    }
    
    res.json(formatResponse('User statistics retrieved successfully', stats));
  } catch (error) {
    next(error);
  }
};

const updateLastOnline = async (req, res, next) => {
  try {
    const now = new Date();
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { lastOnline: now },
      { new: true }
    ).select('lastOnline');
    
    await invalidateUserCache(req.user._id);
    res.json(formatResponse('Last online updated successfully', { lastOnline: user.lastOnline }));
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const query = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ],
      privacy: { $in: ['public', 'link-only'] }
    };
    
    const users = await User.find(query)
      .select('username displayName avatarUrl streak stats privacy')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Round masteryRate for each user
    const usersWithRoundedStats = users.map(user => {
      const u = user.toObject();
      if (u.stats && u.stats.masteryRate) {
        u.stats.masteryRate = Math.round(u.stats.masteryRate * 100) / 100;
      }
      return u;
    });
    
    const total = await User.countDocuments(query);
    const pagination = paginate(total, page, limit);
    
    res.json(formatResponse('Users retrieved successfully', { users: usersWithRoundedStats }, pagination));
  } catch (error) {
    next(error);
  }
};

const getTopStreaks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({ privacy: { $in: ['public', 'link-only'] } })
      .sort({ 'streak.current': -1 })
      .select('username displayName avatarUrl streak stats privacy')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const usersWithRoundedStats = users.map(user => {
      const u = user.toObject();
      if (u.stats && u.stats.masteryRate) {
        u.stats.masteryRate = Math.round(u.stats.masteryRate * 100) / 100;
      }
      return u;
    });
    
    const total = await User.countDocuments({ privacy: { $in: ['public', 'link-only'] } });
    const pagination = paginate(total, page, limit);
    
    res.json(formatResponse('Top streak users retrieved successfully', { users: usersWithRoundedStats }, pagination));
  } catch (error) {
    next(error);
  }
};

const getTopSolved = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({ privacy: { $in: ['public', 'link-only'] } })
      .sort({ 'stats.totalSolved': -1 })
      .select('username displayName avatarUrl streak stats privacy')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const usersWithRoundedStats = users.map(user => {
      const u = user.toObject();
      if (u.stats && u.stats.masteryRate) {
        u.stats.masteryRate = Math.round(u.stats.masteryRate * 100) / 100;
      }
      return u;
    });
    
    const total = await User.countDocuments({ privacy: { $in: ['public', 'link-only'] } });
    const pagination = paginate(total, page, limit);
    
    res.json(formatResponse('Top solved users retrieved successfully', { users: usersWithRoundedStats }, pagination));
  } catch (error) {
    next(error);
  }
};

const deleteCurrentUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    await invalidateUserCache(req.user._id);
    await invalidateDashboardCache(req.user._id);
    res.json(formatResponse('Account deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const checkUsernameAvailability = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.json(formatResponse('Username availability checked', {
      available: !user,
      username: req.params.username
    }));
  } catch (error) {
    next(error);
  }
};

const getUserPublicProgress = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const limit = Math.min(parseInt(req.query.limit) || 6, 6);
    const { sortBy = 'solvedAt', sortOrder = 'desc' } = req.query;

    let sortField;
    if (sortBy === 'solvedAt') {
      sortField = 'attempts.solvedAt';
    } else if (sortBy === 'lastAttemptAt') {
      sortField = 'attempts.lastAttemptAt';
    } else if (sortBy === 'confidenceLevel') {
      sortField = 'confidenceLevel';
    } else if (sortBy === 'totalTimeSpent') {
      sortField = 'totalTimeSpent';
    } else {
      sortField = 'attempts.solvedAt';
    }

    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const user = await User.findById(userId).select('privacy username displayName avatarUrl');
    if (!user) throw new AppError('User not found', 404);
    if (user.privacy !== 'public') throw new AppError('User progress is private', 403);

    const progress = await UserQuestionProgress.find({
      userId,
      status: 'Solved'
    })
      .sort(sort)
      .limit(limit)
      .populate('questionId', '_id title problemLink platform difficulty tags pattern')
      .select('_id questionId status attempts.solvedAt attempts.count attempts.lastAttemptAt attempts.firstAttemptAt revisionCount totalTimeSpent confidenceLevel')
      .lean();

    const formattedProgress = progress.map(p => ({
      _id: p._id,
      questionId: p.questionId,
      status: p.status,
      solvedAt: p.attempts?.solvedAt,
      attempts: {
        count: p.attempts?.count || 0,
        lastAttemptAt: p.attempts?.lastAttemptAt,
        firstAttemptAt: p.attempts?.firstAttemptAt
      },
      revisionCount: p.revisionCount || 0,
      totalTimeSpent: p.totalTimeSpent,
      confidenceLevel: p.confidenceLevel
    }));

    res.json(formatResponse('User public progress retrieved successfully', { progress: formattedProgress }));
  } catch (error) {
    next(error);
  }
};

const changeTimezone = async (req, res, next) => {
  try {
    const { newTimezone, confirm } = req.body;
    const userId = req.user._id;
    const oldTimezone = req.user.preferences?.timezone || 'UTC';

    if (oldTimezone === newTimezone) {
      return res.json(formatResponse('Timezone already set to ' + newTimezone, { timezone: newTimezone }));
    }

    if (!confirm) {
      return res.status(400).json(formatResponse(
        'Changing timezone may affect revision schedules and goals. All due dates will be adjusted to keep the same local dates in the new timezone. This operation may take a few seconds. Please confirm with { confirm: true }',
        { requiredConfirmation: true, oldTimezone, newTimezone }
      ));
    }

    const { jobQueue } = require('../services/queue.service');
    await jobQueue.add({
      type: 'user.timezone_change',
      userId,
      oldTimezone,
      newTimezone,
      triggeredAt: new Date(),
    });

    if (!req.user.preferences) req.user.preferences = {};
    req.user.preferences.timezone = newTimezone;
    await req.user.save();
    await invalidateUserCache(userId);
    await invalidateDashboardCache(userId);

    res.json(formatResponse('Timezone change queued. Data adjustment will complete shortly.', {
      oldTimezone,
      newTimezone,
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  getUserByUsername,
  getUserStats,
  updateLastOnline,
  searchUsers,
  getTopStreaks,
  getTopSolved,
  deleteCurrentUser,
  checkUsernameAvailability,
  getUserPublicProgress,
  changeTimezone,
};