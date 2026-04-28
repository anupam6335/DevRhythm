import { useQuery } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';

export function useGoalChartData(params?: {
  periodType?: 'monthly' | 'yearly';
  range?: 'last12months' | `year=${number}`;
  includeComparison?: boolean;
}) {
  return useQuery({
    queryKey: goalKeys.chartData(params),
    queryFn: () => goalService.getGoalChartData(params),
    staleTime: 10 * 60 * 1000, // 10 minutes – charts don't change often
  });
}