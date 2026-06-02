import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';
import { sheetService } from '../services/sheetsService';
import { sheetsKeys } from './useSheets';
import { sheetDetailKey } from './useSheet';

/**
 * Hook to leave a sheet.
 * On success, invalidates sheets list and detail queries, then shows a success toast.
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useLeaveSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug }: { slug: string }) => sheetService.leaveSheet(slug),

    onSuccess: (_, variables) => {
      // Invalidate sheets list queries (participant count changes)
      queryClient.invalidateQueries({ queryKey: sheetsKeys.lists() });
      // Invalidate the specific sheet detail query
      queryClient.invalidateQueries({ queryKey: sheetDetailKey(variables.slug) });

      toast.success('Successfully left the sheet');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to leave sheet';
      toast.error(message);
    },
  });
}