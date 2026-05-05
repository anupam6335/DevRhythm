import { useQuery } from '@tanstack/react-query';
import { communityService } from '../services/communityService';
import type { GetUsersParams, UsersApiResponse } from '../types/community.types';

export const communityKeys = {
  all: ['community'] as const,
  lists: () => [...communityKeys.all, 'list'] as const,
  list: (params?: GetUsersParams) => [...communityKeys.lists(), params] as const,
};

export function useUsers(
  params?: GetUsersParams,
  options?: { enabled?: boolean; initialData?: UsersApiResponse }
) {
  return useQuery({
    queryKey: communityKeys.list(params),
    queryFn: () => communityService.getUsers(params),
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    enabled: options?.enabled ?? true,
    initialData: options?.initialData,
  });
}