import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

export function useGoals(params?: Parameters<typeof goalService.getGoals>[0]) {
  return useQuery({
    queryKey: goalKeys.list(params),
    queryFn: () => goalService.getGoals(params),
    staleTime: 5 * 60 * 1000,
  });
}