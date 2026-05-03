import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

interface UseCurrentGoalProgressOptions {
  enabled?: boolean;
  initialData?: any;
}

export function useCurrentGoalProgress(options?: UseCurrentGoalProgressOptions) {
  const { data, isLoading, error } = useQuery({
    queryKey: goalKeys.current(),
    queryFn: () => goalService.getCurrentGoals(),
    initialData: options?.initialData,
    staleTime: 10 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });

  return {
    daily: {
      completed: data?.stats?.dailyProgress ?? 0,
      target: data?.stats?.dailyTarget ?? 3,
      remaining: data?.stats?.dailyRemaining ?? 3,
      percentage: data?.stats?.dailyCompletion ?? 0,
    },
    weekly: {
      completed: data?.stats?.weeklyProgress ?? 0,
      target: data?.stats?.weeklyTarget ?? 15,
      remaining: data?.stats?.weeklyRemaining ?? 15,
      percentage: data?.stats?.weeklyCompletion ?? 0,
    },
    isLoading,
    error,
  };
}