import { User } from '@/features/auth/types/auth.types';

export interface Follow {
  _id: string;
  followerId: string | User;
  followedId: string | User;
  action: 'follow' | 'unfollow';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FollowWithUser extends Omit<Follow, 'followerId' | 'followedId'> {
  followerId?: User;
  followedId?: User;
}

export interface FollowStats {
  followingCount: number;
  followersCount: number;
  mutualCount: number;
  newFollowersLast7Days: number;
  topFollowers: Array<{ userId: string; username: string; followedSince: string }>;
  followingDistribution: {
    byActivity: { high: number; medium: number; low: number };
    byStreak: { high: number; medium: number; low: number };
  };
}

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  followId?: string;
  createdAt?: string;
}

export interface FollowSuggestion {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  stats: any;
  streak: any;
  privacy: string;
  mutualFollowers: number;
  reason: string;
}

export interface MutualFollow {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}