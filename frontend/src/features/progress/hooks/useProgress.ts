import { useQuery } from '@tanstack/react-query';
import { progressService } from '../services/progressService';
import { progressKeys } from '@/shared/lib/react-query';

export function useProgress(params?: Parameters<typeof progressService.getProgress>[0]) {
  return useQuery({
    queryKey: progressKeys.list(params),
    queryFn: () => progressService.getProgress(params),
    staleTime: 5 * 60 * 1000,
  });
}