import { useMutation } from '@tanstack/react-query';
import { codeExecutionService } from '@/features/codeExecution/services/codeExecutionService';
import { toast } from '@/shared/components/Toast';

interface RunCodeParams {
  questionId: string;
  code: string;
  language: string;
  testCases: Array<{ stdin: string; expected: string }>;
}

export function useRunCode() {
  return useMutation({
    mutationFn: ({ questionId, code, language, testCases }: RunCodeParams) =>
      codeExecutionService.execute({ questionId, code, language, testCases }),
    onError: (error: any) => {
      // Extract detailed error message from API response if available
      const apiMessage = error.response?.data?.message;
      if (apiMessage && typeof apiMessage === 'string') {
        // Detailed error will be shown in Results tab – no toast needed
        return;
      }
      // Fallback for network errors or unexpected responses
      const genericMessage = error.message || 'Code execution failed';
      toast.error(genericMessage);
    },
  });
}