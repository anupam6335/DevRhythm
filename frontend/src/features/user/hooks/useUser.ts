import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { userKeys } from '@/shared/lib/react-query';

export function useUser() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: userKeys.me(),
    queryFn: userService.getCurrentUser,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user ?? null,
    isLoading,
    error,
    refetch,
  };
}