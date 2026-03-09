export interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  streak: {
    current: number;
    longest: number;
    lastActiveDate?: string;
  };
  stats: {
    totalSolved: number;
    masteryRate: number;
    totalRevisions: number;
    totalTimeSpent: number;
    activeDays: number;
  };
  preferences: {
    dailyGoal: number;
    weeklyGoal: number;
    notifications: {
      revisionReminders: boolean;
      goalTracking: boolean;
      socialInteractions: boolean;
      weeklyReports: boolean;
    };
    timezone: string;
  };
  lastOnline: string;
  accountCreated: string;
  followersCount: number;
  followingCount: number;
  privacy: 'public' | 'private' | 'link-only';
  isActive: boolean;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  userId: string;
}

export interface Session {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}