import { useQuery } from '@tanstack/react-query';
import { studyGroupService } from '../services/studyGroupService';
import { groupKeys } from '@/shared/lib/react-query';
import type { GroupListResponse } from '../types/studyGroup.types';

export function useUserGroups(
  userId?: string,
  isOwnProfile?: boolean,
  limit = 5,
  initialData?: GroupListResponse
) {
  const queryKey = isOwnProfile
    ? groupKeys.my({ limit })
    : groupKeys.userPublic(userId!, { limit });

  const queryFn = isOwnProfile
    ? () => studyGroupService.getMyGroups({ limit })
    : () => studyGroupService.getUserPublicGroups(userId!, { limit });

  return useQuery({
    queryKey,
    queryFn,
    enabled: (isOwnProfile ? true : !!userId) && !initialData,
    initialData: initialData,
    staleTime: 5 * 60 * 1000,
  });
}