import { useQuery } from '@tanstack/react-query';
import { shareService } from '../services/shareService';
import { shareKeys } from '@/shared/lib/react-query';

export function useShare(id: string) {
  return useQuery({
    queryKey: shareKeys.detail(id),
    queryFn: () => shareService.getShareById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}