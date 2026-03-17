import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import type { QuestionStatistics } from '../types/question.types';

export function useStatistics() {
  return useQuery<QuestionStatistics>({
    queryKey: questionsKeys.statistics(),
    queryFn: questionService.getStatistics,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}