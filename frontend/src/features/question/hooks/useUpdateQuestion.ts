import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';
import type { UpdateQuestionRequest } from '@/shared/types';

export function useUpdateQuestion(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateQuestionRequest) => questionService.updateQuestion(id, data),
    onSuccess: (updatedQuestion) => {
      queryClient.invalidateQueries({ queryKey: questionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questionsKeys.detail(id) });
      toast.success('Question updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update question');
    },
  });
}