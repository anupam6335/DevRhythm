import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { userKeys } from '@/shared/lib/react-query';

export function useSearchUsers(q: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: userKeys.search(q),
    queryFn: () => userService.searchUsers(q, page, limit),
    enabled: !!q && q.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}