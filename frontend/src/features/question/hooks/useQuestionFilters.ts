import { useQuery } from '@tanstack/react-query';
import { questionService } from '../services/questionService';
import { questionsKeys } from '@/shared/lib/react-query';

export function useQuestionPatterns() {
  return useQuery({
    queryKey: questionsKeys.patterns(),
    queryFn: questionService.getPatterns,
    staleTime: 30 * 60 * 1000,
  });
}

export function useQuestionTags() {
  return useQuery({
    queryKey: questionsKeys.tags(),
    queryFn: questionService.getTags,
    staleTime: 30 * 60 * 1000,
  });
}

export function useQuestionStatistics() {
  return useQuery({
    queryKey: questionsKeys.statistics(),
    queryFn: questionService.getStatistics,
    staleTime: 60 * 60 * 1000,
  });
}