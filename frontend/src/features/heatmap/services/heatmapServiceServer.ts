import { serverFetch } from '@/shared/lib/serverApiClient';
import type { HeatmapData } from '@/shared/types';
import { buildQueryString } from '@/shared/lib/apiClient';

export const heatmapServiceServer = {
  async getPublicUserHeatmap(userId: string, year: number, params?: { simple?: boolean }): Promise<HeatmapData> {
    const query = buildQueryString(params || {});
    const data = await serverFetch<HeatmapData>(`/users/${userId}/heatmap/${year}${query}`);
    return data;
  },
};