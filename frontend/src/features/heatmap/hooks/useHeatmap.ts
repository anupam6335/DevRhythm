import { useQuery } from '@tanstack/react-query';
import { heatmapService } from '../services/heatmapService';
import { heatmapKeys } from '@/shared/lib/react-query';

export function useHeatmap(year?: number, includeCache?: boolean) {
  const yearToUse = year || new Date().getFullYear();
  return useQuery({
    queryKey: heatmapKeys.detail(yearToUse),
    queryFn: () => heatmapService.getHeatmapByYear(yearToUse, includeCache),
    staleTime: 15 * 60 * 1000,
  });
}