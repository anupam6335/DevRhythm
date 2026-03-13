const User = require('../models/User');
const { invalidateCache } = require('../middleware/cache');

/**
 * Update user streak and active days based on a new activity.
 * @param {string} userId
 * @param {Date} activityDate - date of the activity (defaults to now)
 */
const updateUserActivity = async (userId, activityDate = new Date()) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const today = new Date();
  const todayStr = today.toDateString();
  const lastActive = user.streak.lastActiveDate
    ? new Date(user.streak.lastActiveDate).toDateString()
    : null;

  if (!lastActive) {
    // First activity ever
    user.streak.current = 1;
    user.streak.longest = 1;
    user.stats.activeDays = 1;
  } else if (lastActive !== todayStr) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActive === yesterday.toDateString()) {
      // Consecutive day
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    } else {
      // Streak broken
      user.streak.current = 1;
    }
    user.stats.activeDays += 1;
  }
  // If lastActive === todayStr, do nothing (already counted today)

  user.streak.lastActiveDate = today;
  await user.save();
  await invalidateCache(`user:${userId}:profile`);
  return user;
};

module.exports = { updateUserActivity };