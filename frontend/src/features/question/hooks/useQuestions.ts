import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function useQuestions(params?: Parameters<typeof questionService.getQuestions>[0]) {
  return useQuery({
    queryKey: questionsKeys.list(params),
    queryFn: () => questionService.getQuestions(params),
    staleTime: 5 * 60 * 1000,
  });
}