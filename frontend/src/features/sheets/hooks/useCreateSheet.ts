import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';
import { sheetService } from '../services/sheetsService';
import { sheetsKeys } from './useSheets';
import type { CreateSheetRequest } from '../types/sheets.types';

/**
 * Hook to create a sheet manually (with explicit question identifiers).
 * On success, invalidates sheets list queries and shows a success toast.
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useCreateSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSheetRequest) => sheetService.createSheet(data),

    onSuccess: () => {
      // Invalidate all sheets list queries to show the newly created sheet
      queryClient.invalidateQueries({ queryKey: sheetsKeys.lists() });
      toast.success('Sheet created successfully');
    },

    onError: (error: any) => {
      // Handle duplicate sheet name (409) specially if needed
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Failed to create sheet';

      if (status === 409) {
        toast.error(message);
      } else {
        toast.error(message);
      }
    },
  });
}