import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { PatternMastery } from '@/shared/types';
import type { PatternMasteryListResponse, PatternStats } from '../types/patternMastery.types';

export const patternMasteryService = {
  async getPatternMasteryList(params?: {
    page?: number;
    limit?: number;
    minConfidence?: number;
    maxConfidence?: number;
    minSolved?: number;
    minMasteryRate?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<PatternMasteryListResponse>(`/pattern-mastery${query}`);
    return response.data;
  },

  async getPatternMastery(patternName: string) {
    const response = await apiClient.get<{ pattern: PatternMastery }>(`/pattern-mastery/${encodeURIComponent(patternName)}`);
    return response.data.pattern;
  },

  async getPatternStats() {
    const response = await apiClient.get<{ stats: PatternStats }>('/pattern-mastery/stats');
    return response.data.stats;
  },

  async getRecommendations(limit?: number, focus?: 'weakest' | 'needsPractice' | 'highestPotential') {
    const params: any = {};
    if (limit) params.limit = limit;
    if (focus) params.focus = focus;
    const query = buildQueryString(params);
    const response = await apiClient.get<{ recommendations: PatternMastery[] }>(`/pattern-mastery/recommendations${query}`);
    return response.data.recommendations;
  },

  async getWeakestPatterns(limit?: number, metric?: 'confidence' | 'masteryRate' | 'lastPracticed') {
    const params: any = {};
    if (limit) params.limit = limit;
    if (metric) params.metric = metric;
    const query = buildQueryString(params);
    const response = await apiClient.get<{ weakest: PatternMastery[] }>(`/pattern-mastery/weakest${query}`);
    return response.data.weakest;
  },

  async getStrongestPatterns(limit?: number, metric?: 'confidence' | 'masteryRate' | 'lastPracticed') {
    const params: any = {};
    if (limit) params.limit = limit;
    if (metric) params.metric = metric;
    const query = buildQueryString(params);
    const response = await apiClient.get<{ strongest: PatternMastery[] }>(`/pattern-mastery/strongest${query}`);
    return response.data.strongest;
  },

  async getPatternProgress(params?: { patternName?: string; startDate?: string; endDate?: string; period?: 'week' | 'month' | 'quarter' }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<{ progress: any[] }>(`/pattern-mastery/progress${query}`);
    return response.data.progress;
  },

  /**
   * Get pattern mastery for a specific user (public).
   * GET /users/:userId/pattern-mastery
   */
  async getUserPatternMastery(userId: string, params?: { page?: number; limit?: number }): Promise<PatternMasteryListResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<PatternMasteryListResponse>(`/users/${userId}/pattern-mastery${query}`);
    return response.data;
  }
};