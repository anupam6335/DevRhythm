// features/progress/hooks/useQuestionProgress.ts
import { useQuery } from '@tanstack/react-query';
import { progressService } from '../services/progressService';
import { progressKeys } from '@/shared/lib/react-query';

export function useQuestionProgress(
  questionId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: progressKeys.detail(questionId),
    queryFn: () => progressService.getQuestionProgress(questionId),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}