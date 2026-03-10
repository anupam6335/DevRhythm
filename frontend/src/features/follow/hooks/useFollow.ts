import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followService } from '../services/followService';
import { followKeys } from '@/shared/lib/react-query';

export function useFollow() {
  const queryClient = useQueryClient();

  const follow = useMutation({
    mutationFn: (userId: string) => followService.followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followKeys.stats() });
      queryClient.invalidateQueries({ queryKey: ['follow'] });
    },
  });

  const unfollow = useMutation({
    mutationFn: (userId: string) => followService.unfollowUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followKeys.stats() });
      queryClient.invalidateQueries({ queryKey: ['follow'] });
    },
  });

  return { follow, unfollow };
}