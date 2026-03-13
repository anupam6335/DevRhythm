import { useQueries } from '@tanstack/react-query';
import { followService } from '@/features/follow/services/followService';
import { followKeys } from '@/shared/lib/react-query';
import type { User } from '@/shared/types';

interface UseFollowDataProps {
  userId: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

export function useFollowData({ userId, isOwnProfile, currentUserId }: UseFollowDataProps) {
  const recentLimit = 5;

  const queries = useQueries({
    queries: [
      {
        queryKey: followKeys.followers(userId, { limit: recentLimit, page: 1 }),
        queryFn: () => followService.getPublicFollowers(userId, { limit: recentLimit, page: 1 }),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: followKeys.following(userId, { limit: recentLimit, page: 1 }),
        queryFn: () => followService.getPublicFollowing(userId, { limit: recentLimit, page: 1 }),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
      },
      {
        // Only fetch mutuals if we have both userId and currentUserId
        queryKey: followKeys.mutual(userId, currentUserId || 'none'),
        queryFn: () => followService.getMutualFollows(userId, recentLimit),
        enabled: !!userId && !!currentUserId,
        staleTime: 5 * 60 * 1000,
      },
    ],
  });

  const [followersQuery, followingQuery, mutualsQuery] = queries;

  const followersData = followersQuery.data;
  const followingData = followingQuery.data;
  const mutualsData = mutualsQuery.data;

  // Extract counts and user lists
  const followersCount = followersData?.user?.followersCount ?? 0;
  const followersList = followersData?.followers ?? [];

  const followingCount = followingData?.user?.followingCount ?? 0;
  const followingList = followingData?.following ?? [];

  const mutualsCount = mutualsData?.count ?? 0;
  const mutualsList = mutualsData?.mutualFollows ?? [];

  const isLoading =
    followersQuery.isLoading || followingQuery.isLoading || mutualsQuery.isLoading;
  const error = followersQuery.error || followingQuery.error || mutualsQuery.error;

  return {
    followers: {
      count: followersCount,
      list: followersList,
    },
    following: {
      count: followingCount,
      list: followingList,
    },
    mutuals: {
      count: mutualsCount,
      list: mutualsList,
    },
    isLoading,
    error,
  };
}