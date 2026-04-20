import { useQuery } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';

export function useOverdueRevisionsList(page: number, limit: number = 5) {
  return useQuery({
    queryKey: revisionKeys.overdueList(page, limit),
    queryFn: () => revisionService.getOverdueRevisionsList({ page, limit }),
    staleTime: 2 * 60 * 1000,
  });
}