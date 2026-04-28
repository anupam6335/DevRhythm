import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useDeletePlannedGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalService.deletePlannedGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.plannedLists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      toast.success('Planned goal deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete planned goal');
    },
  });
}