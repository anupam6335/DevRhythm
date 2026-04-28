import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../services/goalService';
import { goalKeys } from '@/shared/lib/react-query';
import { toast } from '@/shared/components/Toast';

export interface CopyGoalPayload {
  timeframe?: 'today' | 'tomorrow' | 'nextWeek' | 'withinMonth';
  startDate?: string;
  endDate?: string;
}

export function useCopyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CopyGoalPayload }) =>
      goalService.copyGoal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.plannedLists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      toast.success('Goal copied successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to copy goal');
    },
  });
}