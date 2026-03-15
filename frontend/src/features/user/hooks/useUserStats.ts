import { useQuery } from '@tanstack/react-query';
import { userStatsService } from '../services/userStatsService';
import { userKeys } from '@/shared/lib/react-query';
import type { UserStats } from '../types/userStats.types';

export function useUserStats(
  userId?: string,
  isOwnProfile?: boolean,
  initialData?: UserStats | null
) {
  const queryKey = isOwnProfile ? userKeys.stats('me') : userKeys.stats(userId!);
  const queryFn = isOwnProfile
    ? userStatsService.getMyStats
    : () => userStatsService.getPublicUserStats(userId!);

  return useQuery({
    queryKey,
    queryFn,
    enabled: (isOwnProfile ? true : !!userId) && !initialData,
    initialData: initialData ?? undefined,
    staleTime: 5 * 60 * 1000,
  });
}