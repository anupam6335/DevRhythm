const { DateTime } = require('luxon');

/**
 * All date functions now accept a timeZone parameter but use UTC‐based
 * date objects internally to avoid local timezone shifts.
 */

const getStartOfDay = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.startOf('day');
    return dt.toJSDate();
  }
  // For UTC, directly use UTC methods
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  const utcMonth = d.getUTCMonth();
  const utcDay = d.getUTCDate();
  return new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0, 0));
};

const getEndOfDay = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.endOf('day');
    return dt.toJSDate();
  }
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  const utcMonth = d.getUTCMonth();
  const utcDay = d.getUTCDate();
  return new Date(Date.UTC(utcYear, utcMonth, utcDay, 23, 59, 59, 999));
};

const getStartOfWeek = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.startOf('week');
    return dt.toJSDate();
  }
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  const utcMonth = d.getUTCMonth();
  const utcDay = d.getUTCDate();
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
  const monday = new Date(Date.UTC(utcYear, utcMonth, utcDay + diffToMonday, 0, 0, 0, 0));
  return monday;
};

const getEndOfWeek = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.endOf('week');
    return dt.toJSDate();
  }
  const startOfWeek = getStartOfWeek(date, 'UTC');
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(endOfWeek.getUTCDate() + 6);
  endOfWeek.setUTCHours(23, 59, 59, 999);
  return endOfWeek;
};

const getStartOfMonth = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.startOf('month');
    return dt.toJSDate();
  }
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  const utcMonth = d.getUTCMonth();
  return new Date(Date.UTC(utcYear, utcMonth, 1, 0, 0, 0, 0));
};

const getEndOfMonth = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.endOf('month');
    return dt.toJSDate();
  }
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  const utcMonth = d.getUTCMonth();
  const lastDay = new Date(Date.UTC(utcYear, utcMonth + 1, 0, 23, 59, 59, 999));
  return lastDay;
};

const getStartOfYear = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.startOf('year');
    return dt.toJSDate();
  }
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  return new Date(Date.UTC(utcYear, 0, 1, 0, 0, 0, 0));
};

const getEndOfYear = (date = new Date(), timeZone = 'UTC') => {
  if (timeZone !== 'UTC') {
    let dt = DateTime.fromJSDate(date, { zone: timeZone });
    dt = dt.endOf('year');
    return dt.toJSDate();
  }
  const d = new Date(date);
  const utcYear = d.getUTCFullYear();
  return new Date(Date.UTC(utcYear, 11, 31, 23, 59, 59, 999));
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const isSameDay = (date1, date2, timeZone = 'UTC') => {
  const d1 = getStartOfDay(date1, timeZone);
  const d2 = getStartOfDay(date2, timeZone);
  return d1.getTime() === d2.getTime();
};

const isToday = (date, timeZone = 'UTC') => {
  const todayStart = getStartOfDay(new Date(), timeZone);
  const todayEnd = getEndOfDay(new Date(), timeZone);
  const d = new Date(date);
  return d >= todayStart && d <= todayEnd;
};

const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const parseDate = (input) => {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  if (typeof input === 'number') {
    if (input < 10000000000) return new Date(input * 1000);
    return new Date(input);
  }
  if (typeof input === 'string') {
    const num = Number(input);
    if (!isNaN(num)) {
      if (num < 10000000000) return new Date(num * 1000);
      return new Date(num);
    }
    const date = new Date(input);
    if (!isNaN(date.getTime())) return date;
  }
  throw new Error(`Invalid date input: ${input}`);
};

module.exports = {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  formatDate,
  isSameDay,
  isToday,
  getDaysBetween,
  parseDate,
};