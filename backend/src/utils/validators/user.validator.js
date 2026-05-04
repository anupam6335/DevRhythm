const Joi = require('joi');

const updateUser = Joi.object({
  displayName: Joi.string().trim().min(2).max(50),
  preferences: Joi.object({
    timezone: Joi.forbidden().messages({
      'any.unknown': 'Timezone cannot be changed here. Use PUT /users/me/timezone endpoint.'
    }),
    notifications: Joi.object({
      revisionReminders: Joi.boolean(),
      goalTracking: Joi.boolean(),
      socialInteractions: Joi.boolean(),
      weeklyReports: Joi.boolean()
    }),
    dailyGoal: Joi.number().integer().min(1).max(50),
    weeklyGoal: Joi.number().integer().min(5).max(100)
  }),
  privacy: Joi.string().valid('public', 'private', 'link-only')
});

const getUserByUsername = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).min(3).max(30).required()
});

const searchUsers = Joi.object({
  q: Joi.string().min(1).max(50).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const topUsers = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const checkUsername = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9._-]+$/).min(3).max(30).required()
});

const followUser = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

const getPublicFollowing = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getUserPublicProgress = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  limit: Joi.number().integer().min(1).max(6).default(6),
  sortBy: Joi.string().valid('solvedAt', 'lastAttemptAt', 'confidenceLevel', 'totalTimeSpent').default('solvedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// ========== Validation for GET /users (list all users) ==========
const getAllUsers = Joi.object({
  page: Joi.number().integer().min(1).max(100).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().pattern(
    /^(totalSolved|masteryRate|totalTimeSpent|createdAt|mutualFriends|iFollow|followsMe)(,(totalSolved|masteryRate|totalTimeSpent|createdAt|mutualFriends|iFollow|followsMe)){0,4}$/
  ).default('totalSolved'),
  sortOrder: Joi.string().pattern(/^(asc|desc)(,(asc|desc)){0,4}$/).optional(),
  search: Joi.string().trim().min(1).max(100).optional()
});

module.exports = {
  updateUser,
  getUserByUsername,
  searchUsers,
  topUsers,
  checkUsername,
  followUser,
  getPublicFollowing,
  getUserPublicProgress,
  getAllUsers,   // exported for use in routes
};