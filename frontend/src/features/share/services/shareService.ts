import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { Share } from '@/shared/types';
import type { ShareListResponse, ShareStats } from '../types/share.types';

export const shareService = {
  async getShares(params?: {
    page?: number;
    limit?: number;
    shareType?: string;
    periodType?: string;
    privacy?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<ShareListResponse>(`/shares${query}`);
    return response.data;
  },

  async getShareStats() {
    const response = await apiClient.get<{ stats: ShareStats }>('/shares/stats');
    return response.data.stats;
  },

  async getShareById(id: string) {
    const response = await apiClient.get<{ share: Share }>(`/shares/${id}`);
    return response.data.share;
  },

  async createShare(data: any) {
    const response = await apiClient.post<{ share: Share; shareUrl: string }>('/shares', data);
    return response.data;
  },

  async updateShare(id: string, data: { privacy?: string; expiresInDays?: number; customPeriodName?: string }) {
    const response = await apiClient.put<{ share: Share }>(`/shares/${id}`, data);
    return response.data.share;
  },

  async deleteShare(id: string) {
    await apiClient.delete(`/shares/${id}`);
  },

  async getShareByToken(token: string) {
    const response = await apiClient.get<{ share: Share }>(`/shares/token/${token}`);
    return response.data.share;
  },

  async getUserPublicShares(username: string, params?: { page?: number; limit?: number; shareType?: string; periodType?: string }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<ShareListResponse>(`/shares/user/${username}${query}`);
    return response.data;
  },

  async refreshShare(id: string, includeQuestions?: boolean, questionLimit?: number) {
    const response = await apiClient.post<{ share: Share }>(`/shares/${id}/refresh`, { includeQuestions, questionLimit });
    return response.data.share;
  },

  async resetShareToken(id: string) {
    const response = await apiClient.post<{ newToken: string; newShareUrl: string }>(`/shares/${id}/reset-token`);
    return response.data;
  }
};