import { useQuery } from '@tanstack/react-query';
import { revisionService } from '../services/revisionService';
import { revisionKeys } from '@/shared/lib/react-query';

export function useRevisions(params?: Parameters<typeof revisionService.getRevisions>[0]) {
  return useQuery({
    queryKey: revisionKeys.list(params),
    queryFn: () => revisionService.getRevisions(params),
    staleTime: 5 * 60 * 1000,
  });
}