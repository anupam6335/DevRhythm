import { useQuery } from '@tanstack/react-query';
import { studyGroupService } from '../services/studyGroupService';
import { groupKeys } from '@/shared/lib/react-query';

export function useStudyGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => studyGroupService.getGroup(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}