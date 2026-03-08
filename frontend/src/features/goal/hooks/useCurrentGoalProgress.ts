import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

export function useCurrentGoalProgress() {
  const { data, isLoading, error } = useQuery({
    queryKey: goalKeys.current(),
    queryFn: goalService.getCurrentGoals,
    staleTime: 5 * 60 * 1000,
  });

  return {
    progress: data?.stats
      ? { completed: data.stats.dailyProgress, target: data.stats.dailyTarget }
      : { completed: 0, target: 3 }, // fallback to defaults
    isLoading,
    error,
  };
}