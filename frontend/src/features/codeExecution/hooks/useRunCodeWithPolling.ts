/**
 * src/features/codeExecution/hooks/useRunCodeWithPolling.ts
 * 
 * Synchronous code execution hook (no polling).
 * Returns a mutation that resolves with the execution result directly.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { codeExecutionService } from '../services/codeExecutionService';
import { toast } from '@/shared/components/Toast';
import type { ExecutionStatus } from '../components/ExecutionStatusIndicator';

interface RunCodeParams {
  questionId: string;
  code: string;
  language: string;
  testCases: Array<{ stdin: string; expected: string }>;
}

interface ExecutionResult {
  results: Array<{
    passed: boolean;
    input: string;
    expected: string;
    output: string;
    error?: string;
  }>;
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
}

export function useRunCodeWithPolling() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ questionId, code, language, testCases }: RunCodeParams): Promise<ExecutionResult> => {
      // Direct POST – no jobId, no polling
      const response = await codeExecutionService.execute({ questionId, code, language, testCases });
      if (!response || !response.results) {
        throw new Error('Invalid response from server');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      if (variables.questionId) {
        queryClient.invalidateQueries({ queryKey: ['questions', variables.questionId, 'details'] });
      }
    },
    onError: (error: any) => {
      console.error('[RunCode] Mutation error:', error);
      
      // Extract detailed error message from backend response
      let errorMessage = 'Code execution failed';
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Only show toast for unexpected errors (syntax errors are displayed in results tab)
      if (!errorMessage.includes('Syntax error') && !errorMessage.includes('IndentationError')) {
        toast.error(errorMessage);
      }
      
      // Re-throw so the component can access the error
      throw error;
    },
  });

  // Derive status from mutation state
  const computedStatus: ExecutionStatus = mutation.isPending ? 'processing' : mutation.isError ? 'failed' : mutation.isSuccess ? 'completed' : 'idle';

  return {
    ...mutation,
    status: computedStatus,
    resetStatus: () => {}, // no-op for compatibility
  };
}