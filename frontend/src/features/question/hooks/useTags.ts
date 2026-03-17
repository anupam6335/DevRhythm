import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function useTags() {
  return useQuery({
    queryKey: questionsKeys.tags(),
    queryFn: questionService.getTags,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}