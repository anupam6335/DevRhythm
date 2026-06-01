import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';
import { sheetService } from '../services/sheetsService';
import { sheetsKeys } from './useSheets';
import { sheetDetailKey } from './useSheet';

export function useDeleteSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug }: { slug: string }) => sheetService.deleteSheet(slug),

    onSuccess: (data, variables) => {
      // Invalidate all sheets list queries (sheet owner removed, may affect visibility)
      queryClient.invalidateQueries({ queryKey: sheetsKeys.lists() });
      // Invalidate the specific sheet detail query
      queryClient.invalidateQueries({ queryKey: sheetDetailKey(variables.slug) });

      // Show warning message from backend if present
      if (data?.warning) {
        toast.warning(data.warning, { duration: 8000 }); // longer duration for important message
      } else {
        toast.success('Sheet deleted successfully');
      }
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to delete sheet';
      toast.error(message);
    },
  });
}