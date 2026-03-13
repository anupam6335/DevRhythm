import type { User } from '@/shared/types';

/**
 * Member of a study group
 */
export interface GroupMember {
  userId: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
  role: 'admin' | 'member';
  joinedAt: string;
}

/**
 * A goal inside a study group
 */
export interface GroupGoal {
  description: string;
  targetCount: number;
  currentCount: number;
  deadline?: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  participants: Array<{
    userId: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
    progress: number;
    completed: boolean;
    completedAt?: string;
  }>;
}

/**
 * A challenge inside a study group
 */
export interface GroupChallenge {
  name: string;
  description?: string;
  challengeType: 'sprint' | 'marathon' | 'difficulty-focused' | 'pattern-focused';
  target: number;
  startDate: string;
  endDate: string;
  participants: Array<{
    userId: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
    progress: number;
    completed: boolean;
    completedAt?: string;
  }>;
  status: 'upcoming' | 'active' | 'completed';
  createdAt: string;
}

/**
 * Full study group (for own profile / detailed view)
 */
export interface StudyGroup {
  _id: string;
  name: string;
  description?: string;
  createdBy: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
  members: GroupMember[];
  goals: GroupGoal[];
  challenges: GroupChallenge[];
  privacy: 'public' | 'private' | 'invite-only';
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified study group (for public profile)
 * Returned by GET /users/:userId/groups
 */
export interface PublicStudyGroup {
  _id: string;
  name: string;
  description?: string;
  privacy: 'public' | 'private' | 'invite-only';
  memberCount: number;
  lastActivityAt: string;
  createdAt: string;
}

/**
 * API response for group list endpoints
 */
export interface GroupListResponse {
  groups: StudyGroup[] | PublicStudyGroup[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Group activity item (for group activity feed)
 */
export interface GroupActivityItem {
  type: 'goal_progress' | 'challenge_progress';
  userId: Pick<User, '_id' | 'username' | 'displayName' | 'avatarUrl'>;
  goalDescription?: string;
  challengeName?: string;
  progress: number;
  target?: number;
  completed: boolean;
  timestamp: string;
}

export interface GroupActivityResponse {
  activities: GroupActivityItem[];
  lastActivityAt: string;
}

export interface GroupStats {
  memberCount: number;
  activeGoals: number;
  activeChallenges: number;
  totalProblemsSolved: number;
  averageDailyActivity: number;
  goalStats: Array<{
    description: string;
    targetCount: number;
    participantCount: number;
    completedCount: number;
    status: string;
  }>;
  challengeStats: Array<{
    name: string;
    participantCount: number;
    completedCount: number;
    status: string;
  }>;
  topPerformers: Array<{
    userId: string;
    username: string;
    problemsSolved: number;
    streak: number;
  }>;
}