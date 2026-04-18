import { useQuery } from '@tanstack/react-query';
import { patternMasteryService } from '../services/patternMasteryService';
import { patternKeys } from '@/shared/lib/react-query';

export function useStrongestPatterns(limit = 1) {
  return useQuery({
    queryKey: patternKeys.strongest('confidence', limit),
    queryFn: () => patternMasteryService.getStrongestPatterns(limit, 'confidence'),
    staleTime: 5 * 60 * 1000,
  });
}

