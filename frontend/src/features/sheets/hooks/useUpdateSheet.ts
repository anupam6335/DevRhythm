import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';
import { sheetService } from '../services/sheetsService';
import { sheetsKeys } from './useSheets';
import { sheetDetailKey } from './useSheet';
import type { UpdateSheetRequest } from '../types/sheets.types';

/**
 * Hook to update sheet metadata (owner only).
 * On success, invalidates sheets list and detail queries, then shows a success toast.
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useUpdateSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, updates }: { slug: string; updates: UpdateSheetRequest }) =>
      sheetService.updateSheet(slug, updates),

    onSuccess: (_, variables) => {
      // Invalidate lists (sheet name/search changes affect listing)
      queryClient.invalidateQueries({ queryKey: sheetsKeys.lists() });
      // Invalidate the specific sheet detail
      queryClient.invalidateQueries({ queryKey: sheetDetailKey(variables.slug) });

      toast.success('Sheet updated successfully');
    },

    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update sheet';
      toast.error(message);
    },
  });
}