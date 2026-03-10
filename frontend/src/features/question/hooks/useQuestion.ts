import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function useQuestion(id: string) {
  return useQuery({
    queryKey: questionsKeys.detail(id),
    queryFn: () => questionService.getQuestionById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}