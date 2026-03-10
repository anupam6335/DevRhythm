import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { followKeys } from '@/shared/lib/react-query';

export function useFollowStats() {
  return useQuery({
    queryKey: followKeys.stats(),
    queryFn: followService.getStats,
    staleTime: 5 * 60 * 1000,
  });
}