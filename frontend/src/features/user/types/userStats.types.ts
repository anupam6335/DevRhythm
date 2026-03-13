export interface DifficultyStats {
  solved: number;
  mastered: number;
}

export interface UserStats {
  totalSolved: number;
  totalMastered: number;
  masteryRate: number; // 0-100
  streak: {
    current: number;
    longest: number;
    lastActiveDate?: string;
  };
  activeDays: number;
  totalTimeSpent: number; // minutes
  totalRevisions: number;
  difficultyBreakdown: {
    Easy: DifficultyStats;
    Medium: DifficultyStats;
    Hard: DifficultyStats;
  };
  platformBreakdown: Record<string, number>;
  preferences?: {
    notifications: any;
    timezone: string;
    dailyGoal: number;
    weeklyGoal: number;
  };
}

export interface UserStatsResponse {
  stats: UserStats;
  userId: string;
}