import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { questionService } from '../services/questionService';

type SearchType = 'name' | 'tag';

export function useLeetCodeSearch(query: string, type: SearchType = 'name') {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel any ongoing request when a new one starts
  const cancelPrevious = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return useQuery({
    queryKey: ['leetcode-search', query, type],
    queryFn: () => {
      cancelPrevious();
      return questionService.searchLeetCodeQuestions(query, type, abortControllerRef.current?.signal);
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}