import { useQuery } from '@tanstack/react-query';
import { patternMasteryService } from '../services/patternMasteryService';
import { patternKeys } from '@/shared/lib/react-query';

export function usePatternMastery(params?: Parameters<typeof patternMasteryService.getPatternMasteryList>[0]) {
  return useQuery({
    queryKey: patternKeys.list(params),
    queryFn: () => patternMasteryService.getPatternMasteryList(params),
    staleTime: 5 * 60 * 1000,
  });
}