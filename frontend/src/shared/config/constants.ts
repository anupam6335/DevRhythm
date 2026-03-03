/**
 * Application-wide constants.
 */

// ===== Pagination =====
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// ===== Revision Schedule =====
/** Spaced repetition intervals in days (default) */
export const REVISION_INTERVALS = [1, 3, 7, 14, 30] as const;

// ===== Heatmap =====
/** Heatmap intensity levels from 0 (none) to 4 (very high) */
export const HEATMAP_LEVELS = [
  { level: 0, color: '#ebedf0', label: 'No activity' },
  { level: 1, color: '#9be9a8', label: 'Low activity' },
  { level: 2, color: '#40c463', label: 'Moderate activity' },
  { level: 3, color: '#30a14e', label: 'High activity' },
  { level: 4, color: '#216e39', label: 'Very high activity' },
] as const;

/** Array of heatmap colors (index = level) */
export const HEATMAP_COLORS = HEATMAP_LEVELS.map((item) => item.color);

// ===== Confidence Levels =====
export const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

// ===== OAuth Providers =====
export const OAUTH_PROVIDERS = ['google', 'github'] as const;

// ===== Goal Defaults =====
export const DEFAULT_DAILY_GOAL = 3;
export const DEFAULT_WEEKLY_GOAL = 15;