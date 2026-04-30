import apiClient from '@/shared/lib/apiClient';
import type { DashboardResponse } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Fetch dashboard data for the authenticated user.
   * GET /dashboard
   * Response is cached for 30 seconds by the backend.
   */
  async getDashboard(): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardResponse>('/dashboard');
    return response.data;
  },
};