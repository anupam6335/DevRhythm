import { useQuery } from '@tanstack/react-query';
import { patternMasteryService } from '../services/patternMasteryService';
import { patternKeys } from '@/shared/lib/react-query';

export function useWeakestPatterns(limit = 1) {
  return useQuery({
    queryKey: patternKeys.weakest('confidence', limit),
    queryFn: () => patternMasteryService.getWeakestPatterns(limit, 'confidence'),
    staleTime: 5 * 60 * 1000,
  });
}