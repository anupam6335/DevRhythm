import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import type { QuestionListResponse } from '../types/question.types';

type DeletedQuestionsParams = Parameters<typeof questionService.getDeletedQuestions>[0];

export function useDeletedQuestions(params?: DeletedQuestionsParams) {
  return useQuery<QuestionListResponse>({
    queryKey: questionsKeys.list({ ...params, deleted: true }), // extend key to differentiate
    queryFn: () => questionService.getDeletedQuestions(params),
    staleTime: 5 * 60 * 1000,
  });
}