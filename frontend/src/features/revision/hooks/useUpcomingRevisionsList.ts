import { useQuery } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';

export function useUpcomingRevisionsList(page: number, limit: number = 5) {
  return useQuery({
    queryKey: revisionKeys.upcomingList(page, limit),
    queryFn: () => revisionService.getUpcomingRevisionsList({ page, limit }),
    staleTime: 2 * 60 * 1000,
  });
}