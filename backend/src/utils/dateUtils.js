class DateUtils {
  static getCurrentDate() {
    return new Date();
  }

  static formatDate(date, format = 'iso') {
    if (!date) return null;
    
    const d = new Date(date);
    
    switch (format) {
      case 'iso':
        return d.toISOString();
      case 'date':
        return d.toISOString().split('T')[0];
      case 'time':
        return d.toISOString().split('T')[1].split('.')[0];
      case 'datetime':
        return d.toLocaleString();
      case 'timestamp':
        return d.getTime();
      default:
        return d.toISOString();
    }
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  static addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  static differenceInDays(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static differenceInHours(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  static differenceInMinutes(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60));
  }

  static isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  static isToday(date) {
    return this.isSameDay(date, new Date());
  }

  static isYesterday(date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(date, yesterday);
  }

  static isThisWeek(date) {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() + 6));
    return date >= startOfWeek && date <= endOfWeek;
  }

  static isThisMonth(date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  static startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  static startOfWeek(date) {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static endOfWeek(date) {
    const result = this.startOfWeek(date);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  static startOfMonth(date) {
    const result = new Date(date.getFullYear(), date.getMonth(), 1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static endOfMonth(date) {
    const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  static getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  static formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  static parseDuration(durationString) {
    const regex = /(\d+)\s*(d|h|m|s)/g;
    let totalMs = 0;
    let match;

    while ((match = regex.exec(durationString)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'd':
          totalMs += value * 24 * 60 * 60 * 1000;
          break;
        case 'h':
          totalMs += value * 60 * 60 * 1000;
          break;
        case 'm':
          totalMs += value * 60 * 1000;
          break;
        case 's':
          totalMs += value * 1000;
          break;
      }
    }

    return totalMs;
  }

  static isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static toTimezone(date, timezone) {
    try {
      return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    } catch (error) {
      return date;
    }
  }

  static getDayName(date, locale = 'en-US') {
    return date.toLocaleDateString(locale, { weekday: 'long' });
  }

  static getMonthName(date, locale = 'en-US') {
    return date.toLocaleDateString(locale, { month: 'long' });
  }

  static getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4) return `${weeks}w ago`;
    
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months}mo ago`;
    
    const years = Math.floor(diffDays / 365);
    return `${years}y ago`;
  }

  static generateDateRange(startDate, endDate, interval = 'day') {
    const dates = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      
      switch (interval) {
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }

    return dates;
  }

  static getAge(date) {
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  static getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
}

module.exports = DateUtils;