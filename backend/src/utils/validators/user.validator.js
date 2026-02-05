const Joi = require('joi');

const updateUser = Joi.object({
  displayName: Joi.string().trim().min(2).max(50),
  preferences: Joi.object({
    timezone: Joi.string().pattern(/^UTC[+-]\d{1,2}:\d{2}$/),
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
  username: Joi.string().alphanum().min(3).max(30).required()
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
  username: Joi.string().alphanum().min(3).max(30).required()
});

const followUser = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

const getPublicFollowing = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

module.exports = {
  updateUser,
  getUserByUsername,
  searchUsers,
  topUsers,
  checkUsername,
  followUser,
  getPublicFollowing
};