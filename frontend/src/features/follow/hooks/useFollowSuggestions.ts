import { useQuery } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { followKeys } from '@/shared/lib/react-query';

export function useFollowSuggestions(limit?: number) {
  return useQuery({
    queryKey: followKeys.suggestions(limit),
    queryFn: () => followService.getSuggestions(limit),
    staleTime: 10 * 60 * 1000,
  });
}