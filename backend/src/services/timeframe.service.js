const { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek } = require("../utils/helpers/date");

const timeframeMap = {
  today: (timeZone) => ({
    startDate: getStartOfDay(new Date(), timeZone),
    endDate: getEndOfDay(new Date(), timeZone),
  }),
  tomorrow: (timeZone) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      startDate: getStartOfDay(tomorrow, timeZone),
      endDate: getEndOfDay(tomorrow, timeZone),
    };
  },
  nextWeek: (timeZone) => {
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return {
      startDate: getStartOfWeek(nextWeekStart, timeZone),
      endDate: getEndOfWeek(nextWeekStart, timeZone),
    };
  },
  withinMonth: (timeZone) => {
    const start = getStartOfDay(new Date(), timeZone);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    end.setUTCHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  },
};

/**
 * Get date range for a given timeframe string.
 * @param {string} timeframe - 'today', 'tomorrow', 'nextWeek', 'withinMonth'
 * @param {string} timeZone - IANA timezone (e.g. 'Asia/Kolkata', 'UTC')
 * @returns {{ startDate: Date, endDate: Date }}
 */
const getDateRangeFromTimeframe = (timeframe, timeZone = 'UTC') => {
  const fn = timeframeMap[timeframe];
  if (!fn) throw new Error(`Invalid timeframe: ${timeframe}`);
  return fn(timeZone);
};

module.exports = { getDateRangeFromTimeframe };