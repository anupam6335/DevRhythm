import { useQuery } from '@tanstack/react-query';
import { patternMasteryService } from '../services/patternMasteryService';
import { patternKeys } from '@/shared/lib/react-query';

export function usePatternStats() {
  return useQuery({
    queryKey: patternKeys.stats(),
    queryFn: () => patternMasteryService.getPatternStats(),
    staleTime: 5 * 60 * 1000,
  });
}