// features/revision/hooks/useRevisionsByQuestion.ts
import { useQuery } from '@tanstack/react-query';
import { revisionService } from '@/features/revision';
import { revisionKeys } from '@/shared/lib/react-query';

export function useRevisionsByQuestion(questionId: string) {
  return useQuery({
    queryKey: revisionKeys.question(questionId),
    queryFn: () => revisionService.getQuestionRevision(questionId),
    enabled: !!questionId,
    staleTime: 5 * 60 * 1000,
  });
}