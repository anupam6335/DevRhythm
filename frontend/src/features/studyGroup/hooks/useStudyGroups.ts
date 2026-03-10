import { useQuery } from '@tanstack/react-query';
import { studyGroupService } from '../services/studyGroupService';
import { groupKeys } from '@/shared/lib/react-query';

export function useStudyGroups(params?: Parameters<typeof studyGroupService.getGroups>[0]) {
  return useQuery({
    queryKey: groupKeys.list(params),
    queryFn: () => studyGroupService.getGroups(params),
    staleTime: 5 * 60 * 1000,
  });
}