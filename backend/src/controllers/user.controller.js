const User = require('../models/User');
const AppError = require('../utils/errors/AppError');
const { generateToken } = require('../middleware/auth');
const { invalidateUserCache } = require('../middleware/cache');
const { paginate } = require('../utils/helpers/pagination');
const { formatResponse } = require('../utils/helpers/response');

const getCurrentUser = async (req, res, next) => {
  try {
    const user = req.user.toObject();
    delete user.__v;
    res.json(formatResponse('User profile retrieved successfully', { user }));
  } catch (error) {
    next(error);
  }
};

const updateCurrentUser = async (req, res, next) => {
  try {
    const updates = {};
    if (req.body.displayName) updates.displayName = req.body.displayName;
    if (req.body.preferences) updates.preferences = req.body.preferences;
    if (req.body.privacy) updates.privacy = req.body.privacy;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-__v');
    
    await invalidateUserCache(req.user._id);
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
    
    res.json(formatResponse('User profile retrieved successfully', { user }));
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
    
    const total = await User.countDocuments(query);
    const pagination = paginate(total, page, limit);
    
    res.json(formatResponse('Users retrieved successfully', { users }, pagination));
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
    
    const total = await User.countDocuments({ privacy: { $in: ['public', 'link-only'] } });
    const pagination = paginate(total, page, limit);
    
    res.json(formatResponse('Top streak users retrieved successfully', { users }, pagination));
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
    
    const total = await User.countDocuments({ privacy: { $in: ['public', 'link-only'] } });
    const pagination = paginate(total, page, limit);
    
    res.json(formatResponse('Top solved users retrieved successfully', { users }, pagination));
  } catch (error) {
    next(error);
  }
};

const deleteCurrentUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    await invalidateUserCache(req.user._id);
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
  checkUsernameAvailability
};