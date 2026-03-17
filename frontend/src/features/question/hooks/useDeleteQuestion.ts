import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionService.deleteQuestion(id),
    onSuccess: () => {
      // Invalidate both active and deleted lists
      queryClient.invalidateQueries({ queryKey: questionsKeys.lists() });
      toast.success('Question moved to deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete question');
    },
  });
}