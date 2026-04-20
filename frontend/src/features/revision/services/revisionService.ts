import apiClient, { buildQueryString, ApiClientResponse } from '@/shared/lib/apiClient';
import type { RevisionSchedule } from '@/shared/types';
import type {
  RevisionListResponse,
  TodayRevisionsResponse,
  UpcomingRevisionsResponse,
  OverdueRevisionsResponse,
  RevisionStats,
  RevisionDashboardStats,
  UpcomingRevisionsListResponse,
  OverdueRevisionsListResponse,
} from '../types/revision.types';

export const revisionService = {
  async getRevisions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    questionId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<RevisionListResponse>(`/revisions${query}`);
    return response.data;
  },

  async getTodayRevisions() {
    const response = await apiClient.get<TodayRevisionsResponse>('/revisions/today');
    return response.data;
  },

  async getUpcomingRevisions(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const query = buildQueryString(params);
    const response = await apiClient.get<UpcomingRevisionsResponse>(`/revisions/upcoming${query}`);
    return response.data;
  },

  async getQuestionRevision(questionId: string) {
    const response = await apiClient.get<{ revision: RevisionSchedule }>(`/revisions/question/${questionId}`);
    return response.data.revision;
  },

  async createRevision(questionId: string, data?: { baseDate?: string; schedule?: string[] }) {
    const response = await apiClient.post<{ revision: RevisionSchedule }>(`/revisions/question/${questionId}`, data);
    return response.data.revision;
  },

  async completeRevision(revisionId: string, data?: { completedAt?: string; status?: 'completed' | 'skipped'; confidenceLevel?: number }) {
    const response = await apiClient.post<{ revision: RevisionSchedule }>(`/revisions/${revisionId}/complete`, data);
    return response.data.revision;
  },

  async completeQuestionRevision(questionId: string, data?: { completedAt?: string; status?: 'completed' | 'skipped'; confidenceLevel?: number }) {
    const response = await apiClient.post<{ revision: RevisionSchedule }>(`/revisions/question/${questionId}/complete`, data);
    return response.data.revision;
  },

  async rescheduleRevision(revisionId: string, newDate: string, revisionIndex: number) {
    const response = await apiClient.put<{ revision: RevisionSchedule }>(`/revisions/${revisionId}/reschedule`, { newDate, revisionIndex });
    return response.data.revision;
  },

  async deleteRevision(revisionId: string) {
    await apiClient.delete(`/revisions/${revisionId}`);
  },

  async deleteQuestionRevision(questionId: string) {
    await apiClient.delete(`/revisions/question/${questionId}`);
  },

  async getRevisionStats() {
    const response = await apiClient.get<{ stats: RevisionStats }>('/revisions/stats');
    return response.data.stats;
  },

  async getOverdueRevisions(params?: { page?: number; limit?: number }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<OverdueRevisionsResponse>(`/revisions/overdue${query}`);
    return response.data;
  },

  async getOverdueRevisionsCount(): Promise<number> {
    const query = buildQueryString({ page: 1, limit: 1 });
    const response = await apiClient.get<OverdueRevisionsResponse>(
      `/revisions/overdue${query}`
    ) as ApiClientResponse<OverdueRevisionsResponse>;
    return response.meta?.pagination?.total ?? 0;
  },

  // ===== Dashboard Methods =====

  /**
   * Fetch detailed revision statistics (includes limited upcoming/overdue items).
   */
  async getDetailedRevisionStats(): Promise<RevisionDashboardStats> {
    const response = await apiClient.get<{ stats: RevisionDashboardStats }>('/revisions/stats?detailed=true');
    return response.data.stats;
  },

  /**
   * Fetch all upcoming revisions (no server pagination). Client-side pagination applied.
   */
  async getUpcomingRevisionsList(params?: { page?: number; limit?: number }): Promise<UpcomingRevisionsListResponse> {
    const response = await apiClient.get<UpcomingRevisionsListResponse>(`/revisions/upcoming`);
    const upcomingRevisions = response.data.upcomingRevisions || [];
    const total = upcomingRevisions.reduce((sum, group) => sum + group.questions.length, 0);
    const page = params?.page || 1;
    const limit = params?.limit || 5;
    return {
      upcomingRevisions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Fetch overdue revisions with server‑side pagination.
   */
  async getOverdueRevisionsList(params?: { page?: number; limit?: number }): Promise<OverdueRevisionsListResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<OverdueRevisionsListResponse>(
      `/revisions/overdue${query}`
    ) as ApiClientResponse<OverdueRevisionsListResponse>;
    return {
      revisions: response.data.revisions,
      pagination: response.meta?.pagination,
    };
  },

  /**
   * Mark a revision as completed or skipped.
   */
  async completeRevisionAction(questionId: string, status: 'completed' | 'skipped' = 'completed', options?: { overdue?: boolean }): Promise<void> {
    const query = options?.overdue ? '?overdue=true' : '';
    await apiClient.post(`/revisions/question/${questionId}/complete${query}`, { status });
  },
};