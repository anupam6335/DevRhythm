import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useRestoreQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionService.restoreQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionsKeys.lists() });
      toast.success('Question restored successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to restore question');
    },
  });
}