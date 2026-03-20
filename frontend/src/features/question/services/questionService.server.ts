import { serverFetch } from '@/shared/lib/serverApiClient';
import type { Question } from '@/shared/types';
import type { QuestionListResponse, QuestionStatistics } from '../types/question.types';
import apiClient, { buildQueryString } from '@/shared/lib/apiClient'; // can reuse the helper

export const questionServiceServer = {
  async getQuestions(params?: {
    page?: number;
    limit?: number;
    platform?: string;
    difficulty?: string;
    pattern?: string;
    tags?: string[];
    search?: string;
  }) {
    const query = buildQueryString(params);
    return serverFetch<QuestionListResponse>(`/questions${query}`);
  },

  async getQuestionByPlatformId(platform: string, platformQuestionId: string): Promise<Question> {
    const data = await serverFetch<{ question: Question }>(
      `/questions/platform/${platform}/${platformQuestionId}`
    );
    return data.question;
  },

  async getQuestionById(id: string) {
    const data = await serverFetch<{ question: Question }>(`/questions/${id}`);
    return data.question;
  },

  async getPatterns() {
    const data = await serverFetch<{ patterns: string[] }>('/questions/patterns');
    return data.patterns;
  },

  async getTags() {
    const data = await serverFetch<{ tags: string[] }>('/questions/tags');
    return data.tags;
  },

  async getStatistics() {
    const data = await serverFetch<{ statistics: QuestionStatistics }>('/questions/statistics');
    return data.statistics;
  },
  async getSimilarQuestions(id: string): Promise<Question[]> {
    const data = await serverFetch<{ similarQuestions: Question[] }>(`/questions/similar/${id}?limit=10`);
    return data.similarQuestions;
  },

  async getDeletedQuestions(params?: {
    page?: number;
    limit?: number;
    platform?: string;
    difficulty?: string;
    pattern?: string;
    tags?: string[];
    search?: string;
  }) {
    const query = buildQueryString(params);
    return serverFetch<QuestionListResponse>(`/questions/deleted${query}`);
  },
};