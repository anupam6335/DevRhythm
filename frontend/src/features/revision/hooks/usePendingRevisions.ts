import { useQuery } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';

export function usePendingRevisions() {
  const { data = 0, isLoading, error } = useQuery({
    queryKey: revisionKeys.overdue({ limit: 1 }),
    queryFn: revisionService.getOverdueRevisionsCount,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    pendingCount: data,
    isLoading,
    error,
  };
}