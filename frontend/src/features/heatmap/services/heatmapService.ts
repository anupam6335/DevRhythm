import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { HeatmapData, HeatmapStatsPanel, HeatmapDailyData } from '@/shared/types';

export const heatmapService = {
  async getHeatmap(year?: number, includeCache?: boolean) {
    const params: any = {};
    if (year) params.year = year;
    if (includeCache !== undefined) params.includeCache = includeCache;
    const query = buildQueryString(params);
    const response = await apiClient.get<HeatmapData>(`/heatmap${query}`);
    return response.data;
  },

  async getHeatmapByYear(year: number, includeCache?: boolean) {
    const params = includeCache !== undefined ? { includeCache } : {};
    const query = buildQueryString(params);
    const response = await apiClient.get<HeatmapData>(`/heatmap/${year}${query}`);
    return response.data;
  },

  async getHeatmapStats(year?: number) {
    const params = year ? { year } : {};
    const query = buildQueryString(params);
    const response = await apiClient.get<HeatmapStatsPanel>(`/heatmap/stats${query}`);
    return response.data;
  },

  async getFilteredHeatmap(viewType: string, year?: number, weekStart?: number, weekEnd?: number) {
    const params: any = { viewType };
    if (year) params.year = year;
    if (weekStart) params.weekStart = weekStart;
    if (weekEnd) params.weekEnd = weekEnd;
    const query = buildQueryString(params);
    const response = await apiClient.get<{ viewType: string; dailyData: HeatmapDailyData[]; summary: any }>(`/heatmap/filter${query}`);
    return response.data;
  },

  async refreshHeatmap(year?: number, forceFullRefresh?: boolean) {
    const response = await apiClient.post('/heatmap/refresh', { year, forceFullRefresh });
    return response.data;
  },

  async exportHeatmap(year?: number, format?: 'json' | 'csv', includeDetails?: boolean) {
    const response = await apiClient.post('/heatmap/export', { year, format, includeDetails });
    return response.data;
  },

  async downloadExport(exportId: string, format?: 'json' | 'csv') {
    const query = format ? `?format=${format}` : '';
    const response = await apiClient.get(`/heatmap/export/${exportId}${query}`, { responseType: 'blob' });
    return response.data;
  },

  /**
   * Get public heatmap data for a user (no authentication required)
  */
  async getPublicUserHeatmap(userId: string, year: number, params?: { simple?: boolean }): Promise<HeatmapData> {
    const query = buildQueryString(params || {});
    const response = await apiClient.get<HeatmapData>(`/users/${userId}/heatmap/${year}${query}`);
    return response.data;
  }
};