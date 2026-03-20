const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getEndOfWeek = (date = new Date()) => {
  const d = getStartOfWeek(date);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const getStartOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

const getEndOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const isSameDay = (date1, date2) => {
  return formatDate(date1) === formatDate(date2);
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
    if (input < 10000000000) {
      return new Date(input * 1000);
    }
    return new Date(input);
  }
  if (typeof input === 'string') {
    const num = Number(input);
    if (!isNaN(num)) {
      if (num < 10000000000) {
        return new Date(num * 1000);
      }
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
  getDaysBetween,
  parseDate
};