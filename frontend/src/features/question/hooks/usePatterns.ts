import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function usePatterns() {
  return useQuery({
    queryKey: questionsKeys.patterns(),
    queryFn: questionService.getPatterns,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}