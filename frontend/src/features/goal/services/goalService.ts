import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { Goal } from '@/shared/types';
import type { GoalListResponse, GoalStats, GoalHistoryResponse } from '../types/goal.types';

export const goalService = {
  async getGoals(params?: {
    page?: number;
    limit?: number;
    goalType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<GoalListResponse>(`/goals${query}`);
    return response.data;
  },

  async getCurrentGoals(date?: string) {
    const params = date ? { date } : {};
    const query = buildQueryString(params);
    const response = await apiClient.get<{ currentGoals: { daily?: Goal; weekly?: Goal }; stats: any }>(`/goals/current${query}`);
    return response.data;
  },

  async getGoalById(id: string) {
    const response = await apiClient.get<{ goal: Goal }>(`/goals/${id}`);
    return response.data.goal;
  },

  async createGoal(data: { goalType: 'daily' | 'weekly'; targetCount: number; startDate: string; endDate: string }) {
    const response = await apiClient.post<{ goal: Goal }>('/goals', data);
    return response.data.goal;
  },

  async updateGoal(id: string, data: Partial<{ targetCount: number; startDate: string; endDate: string }>) {
    const response = await apiClient.put<{ goal: Goal }>(`/goals/${id}`, data);
    return response.data.goal;
  },

  async incrementGoal(id: string, amount?: number) {
    const response = await apiClient.post<{ goal: Goal }>(`/goals/${id}/increment`, { amount });
    return response.data.goal;
  },

  async decrementGoal(id: string, amount?: number) {
    const response = await apiClient.post<{ goal: Goal }>(`/goals/${id}/decrement`, { amount });
    return response.data.goal;
  },

  async setGoalProgress(id: string, completedCount: number) {
    const response = await apiClient.put<{ goal: Goal }>(`/goals/${id}/progress`, { completedCount });
    return response.data.goal;
  },

  async autoCreateGoals(date?: string, goalType?: 'daily' | 'weekly') {
    const params: any = {};
    if (date) params.date = date;
    if (goalType) params.goalType = goalType;
    const query = buildQueryString(params);
    const response = await apiClient.post(`/goals/auto-create${query}`);
    return response.data;
  },

  async deleteGoal(id: string) {
    await apiClient.delete(`/goals/${id}`);
  },

  async getGoalStats(params?: { startDate?: string; endDate?: string; goalType?: string }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<{ stats: GoalStats }>(`/goals/stats${query}`);
    return response.data.stats;
  },

  async getGoalHistory(params?: { period?: string; from?: string; to?: string; goalType?: string; page?: number; limit?: number }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<GoalHistoryResponse>(`/goals/history${query}`);
    return response.data;
  }
};