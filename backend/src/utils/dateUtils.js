const moment = require('moment-timezone');
const config = require('../config/environment');
const constants = require('../config/constants');

class DateUtils {
  constructor() {
    this.defaultTimezone = 'UTC';
    this.dateFormats = {
      iso: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
      date: 'YYYY-MM-DD',
      time: 'HH:mm:ss',
      datetime: 'YYYY-MM-DD HH:mm:ss',
      human: 'MMMM Do YYYY, h:mm:ss a',
      short: 'MMM D, YYYY'
    };
  }

  now(timezone = null) {
    return moment().tz(timezone || this.defaultTimezone);
  }

  format(date, format = 'iso', timezone = null) {
    if (!date) return null;
    
    const m = moment(date);
    if (timezone) {
      m.tz(timezone);
    }
    
    return m.format(this.dateFormats[format] || format);
  }

  parse(dateString, format = 'iso', timezone = null) {
    if (!dateString) return null;
    
    const m = moment(dateString, this.dateFormats[format] || format);
    if (timezone) {
      m.tz(timezone);
    }
    
    return m.isValid() ? m.toDate() : null;
  }

  startOf(date, unit = 'day', timezone = null) {
    const m = moment(date).tz(timezone || this.defaultTimezone);
    return m.startOf(unit).toDate();
  }

  endOf(date, unit = 'day', timezone = null) {
    const m = moment(date).tz(timezone || this.defaultTimezone);
    return m.endOf(unit).toDate();
  }

  add(date, amount, unit = 'days', timezone = null) {
    const m = moment(date).tz(timezone || this.defaultTimezone);
    return m.add(amount, unit).toDate();
  }

  subtract(date, amount, unit = 'days', timezone = null) {
    const m = moment(date).tz(timezone || this.defaultTimezone);
    return m.subtract(amount, unit).toDate();
  }

  difference(date1, date2, unit = 'days') {
    const m1 = moment(date1);
    const m2 = moment(date2);
    return m2.diff(m1, unit);
  }

  isSame(date1, date2, unit = 'day') {
    return moment(date1).isSame(date2, unit);
  }

  isBefore(date1, date2, unit = null) {
    if (unit) {
      return moment(date1).isBefore(date2, unit);
    }
    return moment(date1).isBefore(date2);
  }

  isAfter(date1, date2, unit = null) {
    if (unit) {
      return moment(date1).isAfter(date2, unit);
    }
    return moment(date1).isAfter(date2);
  }

  isBetween(date, start, end, unit = null, inclusivity = '()') {
    return moment(date).isBetween(start, end, unit, inclusivity);
  }

  getWeekNumber(date) {
    return moment(date).isoWeek();
  }

  getMonthNumber(date) {
    return moment(date).month() + 1;
  }

  getYear(date) {
    return moment(date).year();
  }

  getDayOfWeek(date) {
    return moment(date).isoWeekday();
  }

  getDayOfYear(date) {
    return moment(date).dayOfYear();
  }

  getBusinessDays(start, end) {
    let count = 0;
    const current = moment(start);
    const endMoment = moment(end);
    
    while (current.isSameOrBefore(endMoment, 'day')) {
      const dayOfWeek = current.isoWeekday();
      if (dayOfWeek !== 6 && dayOfWeek !== 7) {
        count++;
      }
      current.add(1, 'day');
    }
    
    return count;
  }

  formatDuration(milliseconds, format = 'human') {
    const duration = moment.duration(milliseconds);
    
    if (format === 'human') {
      const parts = [];
      
      const days = Math.floor(duration.asDays());
      if (days > 0) parts.push(`${days}d`);
      
      const hours = duration.hours();
      if (hours > 0) parts.push(`${hours}h`);
      
      const minutes = duration.minutes();
      if (minutes > 0) parts.push(`${minutes}m`);
      
      const seconds = duration.seconds();
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
      
      return parts.join(' ');
    }
    
    if (format === 'seconds') {
      return Math.floor(duration.asSeconds());
    }
    
    if (format === 'minutes') {
      return Math.floor(duration.asMinutes());
    }
    
    if (format === 'hours') {
      return Math.floor(duration.asHours());
    }
    
    return duration.asMilliseconds();
  }

  parseDuration(durationString) {
    return moment.duration(durationString).asMilliseconds();
  }

  getTimeSlots(start, end, interval, timezone = null) {
    const slots = [];
    let current = moment(start).tz(timezone || this.defaultTimezone);
    const endMoment = moment(end).tz(timezone || this.defaultTimezone);
    
    while (current.isBefore(endMoment)) {
      slots.push({
        start: current.toDate(),
        end: current.clone().add(interval, 'minutes').toDate()
      });
      current.add(interval, 'minutes');
    }
    
    return slots;
  }

  isDST(date, timezone = 'UTC') {
    return moment.tz(date, timezone).isDST();
  }

  convertTimezone(date, fromTimezone, toTimezone) {
    return moment.tz(date, fromTimezone).tz(toTimezone).toDate();
  }

  getAge(birthDate, asOfDate = new Date()) {
    return moment(asOfDate).diff(moment(birthDate), 'years');
  }

  getLastDayOfMonth(date) {
    return moment(date).endOf('month').toDate();
  }

  getFirstDayOfMonth(date) {
    return moment(date).startOf('month').toDate();
  }

  getDateRange(startDate, endDate, interval = 'day') {
    const dates = [];
    let current = moment(startDate);
    const end = moment(endDate);
    
    while (current.isSameOrBefore(end, interval)) {
      dates.push(current.toDate());
      current.add(1, interval);
    }
    
    return dates;
  }

  isValidTimezone(timezone) {
    return moment.tz.zone(timezone) !== null;
  }

  getUserTimezone(user) {
    return user && user.timezone && this.isValidTimezone(user.timezone) 
      ? user.timezone 
      : this.defaultTimezone;
  }

  scheduleTime(timeString, timezone = null) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = this.now(timezone);
    const scheduled = now.clone().set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    if (scheduled.isBefore(now)) {
      scheduled.add(1, 'day');
    }
    
    return scheduled.toDate();
  }

  getUpcomingDates(startDate, count, interval = 'days', timezone = null) {
    const dates = [];
    let current = moment(startDate).tz(timezone || this.defaultTimezone);
    
    for (let i = 0; i < count; i++) {
      dates.push(current.toDate());
      current.add(1, interval);
    }
    
    return dates;
  }

  calculateWorkingHours(start, end, breakStart = null, breakEnd = null) {
    const startMoment = moment(start);
    const endMoment = moment(end);
    
    let totalMinutes = endMoment.diff(startMoment, 'minutes');
    
    if (breakStart && breakEnd) {
      const breakStartMoment = moment(breakStart);
      const breakEndMoment = moment(breakEnd);
      
      if (breakStartMoment.isBetween(startMoment, endMoment) && 
          breakEndMoment.isBetween(startMoment, endMoment)) {
        totalMinutes -= breakEndMoment.diff(breakStartMoment, 'minutes');
      }
    }
    
    return {
      minutes: totalMinutes,
      hours: totalMinutes / 60,
      formatted: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
    };
  }

  isWeekend(date) {
    const dayOfWeek = moment(date).isoWeekday();
    return dayOfWeek === 6 || dayOfWeek === 7;
  }

  isWeekday(date) {
    return !this.isWeekend(date);
  }

  getNextWeekday(date) {
    let next = moment(date).add(1, 'day');
    while (this.isWeekend(next.toDate())) {
      next.add(1, 'day');
    }
    return next.toDate();
  }

  getPreviousWeekday(date) {
    let prev = moment(date).subtract(1, 'day');
    while (this.isWeekend(prev.toDate())) {
      prev.subtract(1, 'day');
    }
    return prev.toDate();
  }

  getTimezoneOffset(timezone = 'UTC', date = new Date()) {
    return moment.tz(date, timezone).utcOffset();
  }

  roundToNearest(date, minutes = 15, direction = 'nearest') {
    const m = moment(date);
    const remainder = m.minute() % minutes;
    
    if (remainder === 0) return m.toDate();
    
    if (direction === 'up') {
      m.add(minutes - remainder, 'minutes');
    } else if (direction === 'down') {
      m.subtract(remainder, 'minutes');
    } else {
      if (remainder < minutes / 2) {
        m.subtract(remainder, 'minutes');
      } else {
        m.add(minutes - remainder, 'minutes');
      }
    }
    
    m.second(0).millisecond(0);
    return m.toDate();
  }

  getCurrentQuarter(date = new Date()) {
    const m = moment(date);
    const quarter = Math.floor((m.month() + 3) / 3);
    return {
      quarter,
      start: m.clone().month((quarter - 1) * 3).startOf('month').toDate(),
      end: m.clone().month((quarter - 1) * 3 + 2).endOf('month').toDate()
    };
  }

  getFiscalYear(date = new Date(), startMonth = 4) {
    const m = moment(date);
    const year = m.month() >= startMonth - 1 ? m.year() + 1 : m.year();
    return {
      year,
      start: moment([year - 1, startMonth - 1, 1]).toDate(),
      end: moment([year, startMonth - 1, 0]).toDate()
    };
  }
}

const dateUtils = new DateUtils();
module.exports = dateUtils;