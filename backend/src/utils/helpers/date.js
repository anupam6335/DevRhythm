const { DateTime } = require('luxon');

const getStartOfDay = (date = new Date(), timeZone = 'UTC') => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.startOf('day');
  return dt.toJSDate();
};

const getEndOfDay = (date = new Date(), timeZone = 'UTC') => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.endOf('day');
  return dt.toJSDate();
};

const getStartOfWeek = (date = new Date(), timeZone = 'UTC') => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.startOf('week');
  return dt.toJSDate();
};

const getEndOfWeek = (date = new Date(), timeZone = 'UTC') => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.endOf('week');
  return dt.toJSDate();
};

const getStartOfMonth = (date = new Date(), timeZone = 'UTC') => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.startOf('month');
  return dt.toJSDate();
};

const getEndOfMonth = (date = new Date(), timeZone = 'UTC') => {
  let dt = DateTime.fromJSDate(date, { zone: timeZone });
  dt = dt.endOf('month');
  return dt.toJSDate();
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
  formatDate,
  isSameDay,
  isToday,
  getDaysBetween,
  parseDate,
};