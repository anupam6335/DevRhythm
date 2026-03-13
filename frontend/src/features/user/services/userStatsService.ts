import apiClient from '@/shared/lib/apiClient';
import type { UserStats } from '../types/userStats.types';

export const userStatsService = {
  async getMyStats(): Promise<UserStats> {
    const response = await apiClient.get<{ stats: UserStats }>('/user-stats/me');
    return response.data.stats;
  },

  async getPublicUserStats(userId: string): Promise<UserStats> {
    const response = await apiClient.get<{ stats: UserStats }>(`/user-stats/public/${userId}`);
    return response.data.stats;
  },
};