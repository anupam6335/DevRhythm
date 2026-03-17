import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';

type SearchType = 'name' | 'tag';

export function useLeetCodeSearch(query: string, type: SearchType = 'name') {
  return useQuery({
    queryKey: ['leetcode-search', query, type],
    queryFn: () => questionService.searchLeetCodeQuestions(query, type),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}