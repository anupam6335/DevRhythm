import { useMutation } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { toast } from '@/shared/components/Toast';

export function useLeetCodeFetch() {
  return useMutation({
    mutationFn: (url: string) => questionService.fetchLeetCodeQuestion(url),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to fetch LeetCode problem');
    },
  });
}