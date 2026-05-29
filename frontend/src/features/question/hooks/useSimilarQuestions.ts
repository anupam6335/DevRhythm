import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function useSimilarQuestions(questionId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: [...questionsKeys.detail(questionId), 'similar'],
    queryFn: () => questionService.getSimilarQuestions(questionId),
    enabled: enabled && !!questionId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}