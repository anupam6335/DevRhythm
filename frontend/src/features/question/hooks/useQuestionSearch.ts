import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function useQuestionSearch(searchTerm: string, enabled = true) {
  const trimmedTerm = searchTerm.trim();
  return useQuery({
    queryKey: [...questionsKeys.all, 'search', trimmedTerm],
    queryFn: () => questionService.getQuestions({ search: trimmedTerm, limit: 10 }),
    enabled: enabled && trimmedTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}