import { useQuery } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';

export function useUpcomingRevisions(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: revisionKeys.upcoming(startDate, endDate),
    queryFn: () => revisionService.getUpcomingRevisions(startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });
}