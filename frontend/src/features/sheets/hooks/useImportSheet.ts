import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/shared/components/Toast';
import { sheetService } from '../services/sheetsService';
import { sheetsKeys } from './useSheets';

/**
 * Hook to import a sheet from an uploaded file (Excel, CSV, JSON).
 * On success, invalidates sheets list queries and shows a success toast.
 * On error with unresolved identifiers (400), the error data contains the unresolved list
 * which can be accessed via error.response?.data?.data?.unresolved.
 * @returns Mutation object with mutate, isPending, error, etc.
 */
export function useImportSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => sheetService.importSheet(formData),

    onSuccess: () => {
      // Invalidate all sheets list queries to show the newly imported sheet
      queryClient.invalidateQueries({ queryKey: sheetsKeys.lists() });
      toast.success('Sheet imported successfully');
    },

    onError: (error: any) => {
      const status = error.response?.status;
      const responseData = error.response?.data;
      const message = responseData?.message || error.message || 'Failed to import sheet';

      if (status === 400 && responseData?.data?.unresolved) {
        // Unresolved identifiers – the error message already contains details
        toast.error(message);
      } else if (status === 409) {
        // Duplicate sheet name
        toast.error(message);
      } else {
        toast.error(message);
      }
    },
  });
}