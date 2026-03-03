import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  differenceInDays,
  formatISO,
  formatDistanceToNow,
  addDays,
} from 'date-fns';

/**
 * Returns the start of the given day (00:00:00).
 */
export const getStartOfDay = (date: Date | number = new Date()): Date => {
  return startOfDay(date);
};

/**
 * Returns the end of the given day (23:59:59.999).
 */
export const getEndOfDay = (date: Date | number = new Date()): Date => {
  return endOfDay(date);
};

/**
 * Returns the start of the week (Monday) for the given date.
 */
export const getStartOfWeek = (date: Date | number = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
};

/**
 * Returns the end of the week (Sunday) for the given date.
 */
export const getEndOfWeek = (date: Date | number = new Date()): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Returns the start of the month for the given date.
 */
export const getStartOfMonth = (date: Date | number = new Date()): Date => {
  return startOfMonth(date);
};

/**
 * Returns the end of the month for the given date.
 */
export const getEndOfMonth = (date: Date | number = new Date()): Date => {
  return endOfMonth(date);
};

/**
 * Formats a date as YYYY-MM-DD.
 */
export const formatDate = (date: Date | number): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Checks if two dates are the same day.
 */
export const isSameDayFn = (dateLeft: Date | number, dateRight: Date | number): boolean => {
  return isSameDay(dateLeft, dateRight);
};

/**
 * Returns the number of days between two dates.
 */
export const getDaysBetween = (startDate: Date | number, endDate: Date | number): number => {
  return Math.abs(differenceInDays(endDate, startDate));
};

/**
 * Formats a date as an ISO string (for API).
 */
export const formatDateForAPI = (date: Date | number): string => {
  return formatISO(date);
};

/**
 * Formats a date for display (e.g., "Jan 1, 2023").
 */
export const formatDateForDisplay = (date: Date | number): string => {
  return format(date, 'MMM d, yyyy');
};

/**
 * Returns a relative time string (e.g., "2 days ago").
 */
export const formatRelativeTime = (date: Date | number): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

/**
 * Calculates spaced repetition schedule dates based on a base date and intervals.
 * @param baseDate - The starting date.
 * @param intervals - Array of days after the base date (default: [1,3,7,14,30]).
 * @returns Array of dates.
 */
export const calculateSpacedRepetitionSchedule = (
  baseDate: Date | number,
  intervals: number[] = [1, 3, 7, 14, 30]
): Date[] => {
  return intervals.map(days => addDays(baseDate, days));
};