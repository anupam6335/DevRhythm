/**
 * Common utility types used across the application.
 */

/** MongoDB ObjectId represented as a string */
export type ID = string;

/** ISO 8601 date string */
export type ISODateString = string;

/** Timestamp fields for createdAt and updatedAt */
export type Timestamp = {
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

// ===== Enums (unions) =====

/** Difficulty levels for questions */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

/** Supported coding platforms */
export type Platform =
  | 'LeetCode'
  | 'Codeforces'
  | 'HackerRank'
  | 'AtCoder'
  | 'CodeChef'
  | 'GeeksForGeeks'
  | 'Other';

/** Status of a question for a user */
export type QuestionStatus = 'Not Started' | 'Attempted' | 'Solved' | 'Mastered';

/** Goal type: daily or weekly */
export type GoalType = 'daily' | 'weekly' | 'planned';

/** Goal status */
export type GoalStatus = 'active' | 'completed' | 'failed';

/** Revision status */
export type RevisionStatus = 'active' | 'completed' | 'overdue';

/** Privacy setting for user profiles and shares */
export type Privacy = 'public' | 'private' | 'link-only';

/** Share type */
export type ShareType = 'profile' | 'period';

/** Period type for period shares */
export type PeriodType = 'day' | 'week' | 'month' | 'custom';

/** Study group privacy */
export type StudyGroupPrivacy = 'public' | 'private' | 'invite-only';

/** Study group member role */
export type StudyGroupRole = 'admin' | 'member';

/** Challenge type in study groups */
export type ChallengeType =
  | 'sprint'
  | 'marathon'
  | 'difficulty-focused'
  | 'pattern-focused';

/** Challenge status */
export type ChallengeStatus = 'upcoming' | 'active' | 'completed';

/** Heatmap engagement level */
export type EngagementLevel = 'low' | 'medium' | 'high' | 'very-high';

/** Heatmap sync status */
export type SyncStatus = 'synced' | 'pending' | 'error';

/** Pattern focus for recommendations */
export type PatternFocus = 'weakest' | 'needsPractice' | 'highestPotential';

// ===== Pagination =====

/** Pagination query parameters */
export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/** Sorting parameters */
export type SortParams = {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

/** Filter parameters – generic key-value object */
export type FilterParams = Record<string, unknown>;

// ===== API Response Wrappers =====

/**
 * Base API response format (mirrors backend `formatResponse`).
 */
export type ApiResponse<T = any> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta: Record<string, any>; // can contain pagination, etc.
  error: any | null;
};

/**
 * Paginated API response with `meta.pagination`.
 */
export type PaginatedResponse<T = any> = ApiResponse<T> & {
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    [key: string]: any;
  };
};