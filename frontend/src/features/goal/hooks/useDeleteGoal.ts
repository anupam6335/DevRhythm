import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.plannedLists() });
      toast.success('Goal deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete goal');
    },
  });
}