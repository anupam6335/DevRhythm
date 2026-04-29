import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

export function useCompletedFailedGoals(params?: {
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: goalKeys.completedFailed(params),
    queryFn: () => goalService.getCompletedFailedGoals(params),
    staleTime: 2 * 60 * 1000,
  });
}