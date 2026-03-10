import { useQuery } from '@tanstack/react-query';
import { shareService } from '../services/shareService';
import { shareKeys } from '@/shared/lib/react-query';

export function useShares(params?: Parameters<typeof shareService.getShares>[0]) {
  return useQuery({
    queryKey: shareKeys.list(params),
    queryFn: () => shareService.getShares(params),
    staleTime: 5 * 60 * 1000,
  });
}