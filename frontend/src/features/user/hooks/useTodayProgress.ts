import { useQuery } from '@tanstack/react-query';
import { goalService } from '@/features/goal/services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

export function useTodayProgress() {
  const { data, isLoading, error } = useQuery({
    queryKey: goalKeys.current(),
    queryFn: () => goalService.getCurrentGoals(),
    staleTime: 2 * 60 * 1000,
  });

  return {
    solvedToday: data?.stats?.dailyProgress ?? 0,
    isLoading,
    error,
  };
}