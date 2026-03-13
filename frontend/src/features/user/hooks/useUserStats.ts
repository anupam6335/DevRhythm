import { useQuery } from '@tanstack/react-query';
import { userStatsService } from '../services/userStatsService';
import { userKeys } from '@/shared/lib/react-query';

export function useUserStats(userId?: string, isOwnProfile?: boolean) {
  const queryKey = isOwnProfile ? userKeys.stats('me') : userKeys.stats(userId!);
  const queryFn = isOwnProfile
    ? userStatsService.getMyStats
    : () => userStatsService.getPublicUserStats(userId!);

  return useQuery({
    queryKey,
    queryFn,
    enabled: isOwnProfile ? true : !!userId,
    staleTime: 5 * 60 * 1000,
  });
}