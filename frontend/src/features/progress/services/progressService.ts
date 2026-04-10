import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { UserQuestionProgress } from '@/shared/types';
import type { ProgressListResponse, ProgressStats } from '../types/progress.types';

export const progressService = {
  async getProgress(params?: {
    page?: number;
    limit?: number;
    status?: string;
    questionId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    minConfidence?: number;
    maxConfidence?: number;
  }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<ProgressListResponse>(`/progress${query}`);
    return response.data;
  },

  async getProgressStats() {
    const response = await apiClient.get<{ stats: ProgressStats }>('/progress/stats');
    return response.data.stats;
  },

  async getRecentProgress(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ progress: UserQuestionProgress[] }>(`/progress/recent${query}`);
    return response.data.progress;
  },

  async getQuestionProgress(questionId: string): Promise<UserQuestionProgress | null> {
    try {
      const response = await apiClient.get<{ progress: UserQuestionProgress }>(`/progress/question/${questionId}`);
      return response.data.progress;
    } catch (error: any) {
      // If no progress record exists (404), return null instead of throwing.
      // This allows the UI to treat it as "Not Started".
      if (error.response?.status === 404) {
        return null;
      }
      // For any other error, rethrow to let React Query handle it.
      throw error;
    }
  },

  async createOrUpdateProgress(
    questionId: string,
    data: {
      status?: string;
      notes?: string;
      keyInsights?: string;
      savedCode?: { language: string; code: string };
      confidenceLevel?: number;
      timeSpent?: number;
    }
  ) {
    const response = await apiClient.post<{ progress: UserQuestionProgress }>(`/progress/question/${questionId}`, data);
    return response.data.progress;
  },

  async updateStatus(questionId: string, status: string) {
    const response = await apiClient.put<{ progress: UserQuestionProgress }>(`/progress/status/${questionId}`, { status });
    return response.data.progress;
  },

  async updateCode(questionId: string, language: string, code: string) {
    const response = await apiClient.put<{ progress: UserQuestionProgress }>(`/progress/code/${questionId}`, { language, code });
    return response.data.progress;
  },

  async updateNotes(questionId: string, notes?: string, keyInsights?: string) {
    const response = await apiClient.put<{ progress: UserQuestionProgress }>(`/progress/notes/${questionId}`, { notes, keyInsights });
    return response.data.progress;
  },

  async updateConfidence(questionId: string, confidenceLevel: number) {
    const response = await apiClient.put<{ progress: UserQuestionProgress }>(`/progress/confidence/${questionId}`, { confidenceLevel });
    return response.data.progress;
  },

  async recordAttempt(questionId: string, timeSpent?: number, successful?: boolean) {
    const response = await apiClient.post<{ progress: UserQuestionProgress }>(`/progress/attempt/${questionId}`, { timeSpent, successful });
    return response.data.progress;
  },

  async recordRevision(questionId: string, timeSpent?: number, confidenceLevel?: number) {
    const response = await apiClient.post<{ progress: UserQuestionProgress }>(`/progress/revision/${questionId}`, { timeSpent, confidenceLevel });
    return response.data.progress;
  },

  async deleteProgress(questionId: string) {
    await apiClient.delete(`/progress/question/${questionId}`);
  }
};