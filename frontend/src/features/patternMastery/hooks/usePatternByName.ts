import { useQuery } from '@tanstack/react-query';
import { patternMasteryService } from '../services/patternMasteryService';
import { patternKeys } from '@/shared/lib/react-query';

export function usePatternByName(patternName: string) {
  return useQuery({
    queryKey: [...patternKeys.detail(patternName)],
    queryFn: () => patternMasteryService.getPatternMasteryByName(patternName),
    enabled: !!patternName,
    staleTime: 5 * 60 * 1000,
  });
}