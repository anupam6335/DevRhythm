import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

interface CompleteRevisionParams {
  questionId: string;
  status: 'completed' | 'skipped';
  isOverdue?: boolean;
}

export function useCompleteRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId, status, isOverdue }: CompleteRevisionParams) =>
      revisionService.completeRevisionAction(questionId, status, { overdue: isOverdue }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: revisionKeys.all });
      toast.success(
        status === 'completed'
          ? 'Revision marked as completed!'
          : 'Revision skipped. It will reappear later.'
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update revision';
      toast.error(message);
    },
  });
}