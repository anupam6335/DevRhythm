import { useQuery } from '@tanstack/react-query';
import { revisionService } from '@/features/revision';
import { revisionKeys } from '@/shared/lib/react-query';

export function useQuestionRevision(questionId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: revisionKeys.question(questionId),
    queryFn: () => revisionService.getQuestionRevision(questionId),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}