import type { Goal } from '@/shared/types';

export interface GoalListResponse {
  goals: Goal[];
  pagination: any;
}

export interface GoalStats {
  totalGoals: number;
  completed: number;
  failed: number;
  active: number;
  completionRate: number;
  averageCompletion: number;
  byGoalType: {
    daily: { total: number; completed: number; completionRate: number };
    weekly: { total: number; completed: number; completionRate: number };
  };
  streak: {
    current: number;
    longest: number;
  };
}

export interface GoalHistoryResponse {
  history: Array<{
    period: string;
    goalType: string;
    totalGoals: number;
    completed: number;
    completionRate: number;
    averageCompletion: number;
  }>;
  trends: {
    completionRateTrend: number;
    averageCompletionTrend: number;
    streakTrend: number;
  };
  dateRange: { from: string; to: string };
  pagination: any;
}