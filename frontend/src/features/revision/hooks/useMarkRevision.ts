import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionService } from '@/features/revision';
import { revisionKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useMarkRevision(questionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revisionService.completeQuestionRevision(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionKeys.question(questionId) });
      toast.success('Revision marked as completed');
    },
    onError: (error: any) => {
      // Extract the error message from the API response
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to mark revision. Please try again.';
      toast.error(message);
    },
  });
}