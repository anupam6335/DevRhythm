import { useQuery } from '@tanstack/react-query';
import { heatmapService } from '../services/heatmapService';
import { heatmapKeys } from '@/shared/lib/react-query';

export function useHeatmapFilters(viewType: string, year?: number, weekStart?: number, weekEnd?: number) {
  const yearToUse = year || new Date().getFullYear();
  return useQuery({
    queryKey: heatmapKeys.filtered(yearToUse, viewType),
    queryFn: () => heatmapService.getFilteredHeatmap(viewType, yearToUse, weekStart, weekEnd),
    staleTime: 15 * 60 * 1000,
  });
}