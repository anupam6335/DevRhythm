import type { UserQuestionProgress } from '@/shared/types';

export interface ProgressListResponse {
  progress: UserQuestionProgress[];
  pagination: any;
}

export interface ProgressStats {
  totalSolved: number;
  totalAttempted: number;
  totalMastered: number;
  totalTimeSpent: number;
  averageConfidence: number;
  byDifficulty: {
    easy: { solved: number; mastered: number };
    medium: { solved: number; mastered: number };
    hard: { solved: number; mastered: number };
  };
  byPlatform: Record<string, number>;
  recentActivity: any[];
}