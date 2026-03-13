import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/features/activity/services/activityService';

export function useRecentActivity(userId?: string, isOwnProfile?: boolean, limit = 6) {
  return useQuery({
    queryKey: ['activity', 'recent', { limit }],
    queryFn: () => activityService.getMyActivity({ limit }),
    enabled: isOwnProfile, // only fetch for own profile
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}