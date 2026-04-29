import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

export function usePlannedGoals(params?: {
  page?: number;
  limit?: number;
  status?: 'active' | 'completed' | 'failed';
}) {
  return useQuery({
    queryKey: goalKeys.plannedList(params),
    queryFn: () => goalService.getPlannedGoals(params),
    staleTime: 2 * 60 * 1000,
  });
}