import { useQuery } from '@tanstack/react-query';
import { studyGroupService } from '../services/studyGroupService';
import { groupKeys } from '@/shared/lib/react-query';

export function useGroupMembership(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: groupKeys.my(params),
    queryFn: () => studyGroupService.getMyGroups(params),
    staleTime: 5 * 60 * 1000,
  });
}