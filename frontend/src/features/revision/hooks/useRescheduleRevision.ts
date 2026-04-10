import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionService } from '@/features/revision';
import { revisionKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useRescheduleRevision(questionId: string, revisionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (baseDate: Date) => {
      // 1. Delete existing revision schedule
      await revisionService.deleteQuestionRevision(questionId);
      // 2. Create a new revision schedule with the new base date
      const newRevision = await revisionService.createRevision(questionId, { baseDate: baseDate.toISOString() });
      return newRevision;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionKeys.all });
      toast.success('Revision schedule rescheduled successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to reschedule revision';
      toast.error(message);
    },
  });
}