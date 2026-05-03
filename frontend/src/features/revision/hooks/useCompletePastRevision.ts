import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { toast } from '@/shared/components/Toast';

interface CompletePastRevisionParams {
  questionId: string;
  date: string;
}

export function useCompletePastRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, date }: CompletePastRevisionParams) =>
      revisionService.completePastRevision(questionId, date),
    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ['revisions', 'overdue'] });
      queryClient.invalidateQueries({ queryKey: ['revisions', 'question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['revisions', 'stats'] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to complete revision. Please ensure you have spent sufficient active time on the question.';
      toast.error(message);
      // No re‑throw – component will handle re‑enabling
    },
  });
}