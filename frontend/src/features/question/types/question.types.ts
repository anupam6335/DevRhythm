import type { Question } from '@/shared/types';

export interface QuestionListResponse {
  questions: Question[];
  pagination: any;
}

export interface QuestionStatistics {
  totalQuestions: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  byPlatform: Record<string, number>;
  totalPatterns: number;
  totalTags: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}