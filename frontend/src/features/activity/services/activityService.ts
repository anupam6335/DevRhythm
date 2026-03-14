import apiClient, { buildQueryString } from '@/shared/lib/apiClient';

export interface ActivityLog {
  _id: string;
  userId: string;
  action: string;
  targetId: any;
  targetModel: string;
  metadata: Record<string, any>;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityResponse {
  logs: ActivityLog[];
  pagination: any;
}

export const activityService = {
  async getMyActivity(params?: { page?: number; limit?: number; action?: string; startDate?: string; endDate?: string }): Promise<ActivityResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<ActivityResponse>(`/activity${query}`);
    return response.data;
  },

  async getActivityFeed(params?: { page?: number; limit?: number }): Promise<ActivityResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<ActivityResponse>(`/activity/feed${query}`);
    return response.data;
  }
};