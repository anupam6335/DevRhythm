const { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek } = require("../utils/helpers/date");

const timeframeMap = {
  today: () => ({
    startDate: getStartOfDay(),
    endDate: getEndOfDay(),
  }),
  tomorrow: () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      startDate: getStartOfDay(tomorrow),
      endDate: getEndOfDay(tomorrow),
    };
  },
  nextWeek: () => {
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    return {
      startDate: getStartOfWeek(nextWeekStart),
      endDate: getEndOfWeek(nextWeekStart),
    };
  },
  withinMonth: () => {
    const start = getStartOfDay();
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    end.setUTCHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  },
};

const getDateRangeFromTimeframe = (timeframe) => {
  const fn = timeframeMap[timeframe];
  if (!fn) throw new Error(`Invalid timeframe: ${timeframe}`);
  return fn();
};

module.exports = { getDateRangeFromTimeframe };