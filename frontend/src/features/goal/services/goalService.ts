import apiClient from '@/shared/lib/apiClient';
import type { Goal } from '@/shared/types';

export interface CurrentGoalsResponse {
  currentGoals: {
    daily?: Goal;
    weekly?: Goal;
  };
  stats: {
    dailyProgress: number;
    dailyTarget: number;
    dailyRemaining: number;
    weeklyProgress: number;
    weeklyTarget: number;
    weeklyRemaining: number;
    dailyCompletion: number;
    weeklyCompletion: number;
  };
}

export const goalService = {
  /**
   * Get current active goals (daily and weekly) and their stats.
   * GET /goals/current
   */
  async getCurrentGoals(): Promise<CurrentGoalsResponse> {
    const response = await apiClient.get<CurrentGoalsResponse>('/goals/current');
    return response.data;
  },
};