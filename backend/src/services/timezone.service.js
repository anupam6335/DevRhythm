const { DateTime } = require('luxon');
const geoip = require('geoip-lite');
const User = require('../models/User');

/**
 * Get user's timezone from database or detect from IP (used during first login)
 */
const getUserTimeZone = async (userId, fallbackIp = null) => {
  const user = await User.findById(userId).select('preferences.timezone');
  if (user?.preferences?.timezone) return user.preferences.timezone;

  if (fallbackIp) {
    const geo = geoip.lookup(fallbackIp);
    if (geo && geo.country === 'IN') return 'Asia/Kolkata';
  }
  return 'UTC';
};

/**
 * Convert a JS Date to a Luxon DateTime in user's timezone
 */
const toUserDateTime = (date, timeZone) => {
  return DateTime.fromJSDate(date, { zone: timeZone });
};

/**
 * Start of day in user's timezone (returns UTC timestamp)
 */
const getStartOfUserDay = (date, timeZone) => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.startOf('day');
  return dt.toJSDate();
};

/**
 * End of day in user's timezone
 */
const getEndOfUserDay = (date, timeZone) => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.endOf('day');
  return dt.toJSDate();
};

/**
 * Start of week (Monday) in user's timezone
 */
const getStartOfUserWeek = (date, timeZone) => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.startOf('week'); // ISO week (Monday)
  return dt.toJSDate();
};

/**
 * End of week (Sunday) in user's timezone
 */
const getEndOfUserWeek = (date, timeZone) => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.endOf('week');
  return dt.toJSDate();
};

/**
 * Start of month in user's timezone
 */
const getStartOfUserMonth = (date, timeZone) => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.startOf('month');
  return dt.toJSDate();
};

/**
 * End of month in user's timezone
 */
const getEndOfUserMonth = (date, timeZone) => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.endOf('month');
  return dt.toJSDate();
};

module.exports = {
  getUserTimeZone,
  toUserDateTime,
  getStartOfUserDay,
  getEndOfUserDay,
  getStartOfUserWeek,
  getEndOfUserWeek,
  getStartOfUserMonth,
  getEndOfUserMonth,
};