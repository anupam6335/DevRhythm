import { useQuery } from '@tanstack/react-query';
import { codeExecutionService } from '@/features/codeExecution/services/codeExecutionService';
import { codeExecutionKeys } from '@/shared/lib/react-query';

export function useCodeHistory(questionId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: codeExecutionKeys.history(questionId, params),
    queryFn: () => codeExecutionService.getHistory(questionId, params),
    enabled: false, // lazy load
    staleTime: 5 * 60 * 1000,
  });
}