import { serverFetch } from '@/shared/lib/serverApiClient';
import type { User, HeatmapData, PublicProgressItem } from '@/shared/types';
import { buildQueryString } from '@/shared/lib/apiClient';

export const userServiceServer = {
  async getUserByUsername(username: string): Promise<User> {
    const data = await serverFetch<{ user: User }>(`/users/${username}`);
    return data.user;
  },

  async getUserPublicProgress(
    userId: string,
    options?: { limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<PublicProgressItem[]> {
    const params: Record<string, any> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.sortBy) params.sortBy = options.sortBy;
    if (options?.sortOrder) params.sortOrder = options.sortOrder;
    const query = buildQueryString(params);
    const data = await serverFetch<{ progress: PublicProgressItem[] }>(`/users/${userId}/progress${query}`);
    return data.progress;
  },

  async getUserHeatmap(userId: string, year: number): Promise<HeatmapData> {
    const data = await serverFetch<HeatmapData>(`/users/${userId}/heatmap/${year}`);
    return data;
  },
};