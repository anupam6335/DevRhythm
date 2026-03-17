import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function usePermanentDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionService.permanentDeleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionsKeys.lists() });
      toast.success('Question permanently deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to permanently delete question');
    },
  });
}