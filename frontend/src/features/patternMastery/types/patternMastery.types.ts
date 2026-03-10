import type { PatternMastery } from '@/shared/types';

export interface PatternMasteryListResponse {
  patterns: PatternMastery[];
  pagination: any;
}

export interface PatternStats {
  totalPatterns: number;
  totalSolved: number;
  totalMastered: number;
  averageConfidence: number;
  averageMasteryRate: number;
  strongestPattern: PatternMastery | null;
  weakestPattern: PatternMastery | null;
  patternsByConfidence: Record<number, number>;
}

export interface PatternRecommendation extends PatternMastery {
  reason?: string;
}