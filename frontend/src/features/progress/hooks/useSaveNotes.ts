import { useMutation, useQueryClient } from '@tanstack/react-query';
import { progressService } from '@/features/progress';
import { progressKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useSaveNotes(questionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ notes, keyInsights }: { notes?: string; keyInsights?: string }) =>
      progressService.updateNotes(questionId, notes, keyInsights),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.detail(questionId) });
      toast.success('Notes saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save notes');
    },
  });
}