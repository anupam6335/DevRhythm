import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import type { HeatmapData } from '@/shared/types';

export function usePublicHeatmap(userId: string, year: number) {
  return useQuery({
    queryKey: ['user', userId, 'heatmap', year],
    queryFn: () => userService.getUserHeatmap(userId, year),
    enabled: !!userId && !!year,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}