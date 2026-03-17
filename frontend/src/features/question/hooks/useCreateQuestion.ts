import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';
import type { CreateQuestionRequest } from '@/shared/types';

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => questionService.createQuestion(data),
    onSuccess: () => {
      // Invalidate questions list queries
      queryClient.invalidateQueries({ queryKey: questionsKeys.lists() });
      toast.success('Question created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create question');
    },
  });
}