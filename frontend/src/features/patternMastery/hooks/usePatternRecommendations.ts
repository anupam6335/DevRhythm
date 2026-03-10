import { useQuery } from '@tanstack/react-query';
import { patternMasteryService } from '../services/patternMasteryService';
import { patternKeys } from '@/shared/lib/react-query';

export function usePatternRecommendations(limit?: number, focus?: 'weakest' | 'needsPractice' | 'highestPotential') {
  return useQuery({
    queryKey: patternKeys.recommendations(focus, limit),
    queryFn: () => patternMasteryService.getRecommendations(limit, focus),
    staleTime: 10 * 60 * 1000,
  });
}