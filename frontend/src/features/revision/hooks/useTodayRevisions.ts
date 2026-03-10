import { useQuery } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';

export function useTodayRevisions() {
  return useQuery({
    queryKey: revisionKeys.today(),
    queryFn: revisionService.getTodayRevisions,
    staleTime: 2 * 60 * 1000,
  });
}