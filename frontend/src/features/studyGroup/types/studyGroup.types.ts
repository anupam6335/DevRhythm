import type { StudyGroup } from '@/shared/types';

export interface GroupListResponse {
  groups: StudyGroup[];
  pagination: any;
}

export interface GroupActivity {
  activities: any[];
  lastActivityAt: string;
}

export interface GroupStats {
  memberCount: number;
  activeGoals: number;
  activeChallenges: number;
  totalProblemsSolved: number;
  averageDailyActivity: number;
  goalStats: any[];
  challengeStats: any[];
  topPerformers: any[];
}