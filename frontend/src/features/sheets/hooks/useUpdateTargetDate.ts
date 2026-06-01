import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';
import { sheetService } from '../services/sheetsService';
import { sheetDetailKey } from './useSheet';

/**
 * Hook to update the current user's target date for a sheet.
 * On success, invalidates the sheet detail query and shows a success toast.
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useUpdateTargetDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, targetDate }: { slug: string; targetDate: string }) =>
      sheetService.updateTargetDate(slug, targetDate),

    onSuccess: (_, variables) => {
      // Invalidate the sheet detail query to refresh target date display
      queryClient.invalidateQueries({ queryKey: sheetDetailKey(variables.slug) });

      toast.success('Target date updated successfully');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update target date';
      toast.error(message);
    },
  });
}