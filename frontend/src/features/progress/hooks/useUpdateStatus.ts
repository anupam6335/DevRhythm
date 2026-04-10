import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressService } from '@/features/progress';
import { progressKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useUpdateStatus(questionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: string) => progressService.updateStatus(questionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.detail(questionId) });
      toast.success('Question marked as solved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}