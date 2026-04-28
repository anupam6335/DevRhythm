import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';
import type { GoalStats } from '../types/goal.types';

export function useGoalStats(initialData?: GoalStats) {
  return useQuery({
    queryKey: goalKeys.stats(),
    queryFn: () => goalService.getGoalStats(),
    initialData,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}