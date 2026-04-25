const User = require('../models/User');
const { invalidateCache } = require('../middleware/cache');
const { getStartOfDay } = require('../utils/helpers/date');
const { DateTime } = require('luxon');

const getLocalDateStr = (date, timeZone) => {
  return DateTime.fromJSDate(date, { zone: timeZone }).toFormat('yyyy-MM-dd');
};

const updateUserActivity = async (userId, activityDate = new Date(), timeZone = 'UTC') => {
  const user = await User.findById(userId);
  if (!user) return null;

  const todayLocal = getLocalDateStr(new Date(), timeZone);
  const activityLocal = getLocalDateStr(activityDate, timeZone);

  // Only update if activity is on or before today (ignore future)
  if (activityLocal > todayLocal) return user;

  const lastActiveLocal = user.streak.lastActiveDate
    ? getLocalDateStr(user.streak.lastActiveDate, timeZone)
    : null;

  if (!lastActiveLocal) {
    // First activity ever
    user.streak.current = 1;
    user.streak.longest = 1;
    user.stats.activeDays = 1;
  } else if (lastActiveLocal !== activityLocal) {
    // Check if last active was yesterday (in user's local timezone)
    const activityDateObj = new Date(activityDate);
    const yesterdayLocal = getLocalDateStr(
      new Date(activityDateObj.setDate(activityDateObj.getDate() - 1)),
      timeZone
    );
    if (lastActiveLocal === yesterdayLocal) {
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    } else {
      user.streak.current = 1;
    }
    user.stats.activeDays += 1;
  }
  // else same day → do nothing

  // Store last active date as the start of the local day in UTC (for consistency)
  const localStartUTC = getStartOfDay(activityDate, timeZone);
  user.streak.lastActiveDate = localStartUTC;

  await user.save();
  await invalidateCache(`user:${userId}:profile`);
  return user;
};

module.exports = { updateUserActivity };