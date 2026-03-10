import { useQuery } from '@tanstack/react-query';
import { progressService } from '../services/progressService';
import { progressKeys } from '@/shared/lib/react-query';

export function useQuestionProgress(questionId: string) {
  return useQuery({
    queryKey: progressKeys.detail(questionId),
    queryFn: () => progressService.getQuestionProgress(questionId),
    enabled: !!questionId,
    staleTime: 5 * 60 * 1000,
  });
}