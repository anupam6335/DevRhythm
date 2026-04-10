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
      codeExecutionService.execute({
        questionId,
        code,
        language,
        testCases,
      }),
    onError: (error: any) => {
      toast.error(error.message || 'Code execution failed');
    },
  });
}