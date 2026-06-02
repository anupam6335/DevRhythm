import { useQuery } from '@tanstack/react-query';
import { sheetService } from '../services/sheetsService';
import type { GetSheetsParams, SheetsListResponse } from '../types/sheets.types';

// Query key factory for sheets (local definition; will be moved to shared/lib/react-query later)
const sheetsKeys = {
  all: ['sheets'] as const,
  lists: () => [...sheetsKeys.all, 'list'] as const,
  list: (params?: GetSheetsParams) => [...sheetsKeys.lists(), params] as const,
};

/**
 * Hook to fetch paginated list of sheets with optional filters.
 * @param params - Pagination, search, sorting, owner filter
 * @returns React Query result with data, isLoading, error, refetch
 */
export function useSheets(params?: GetSheetsParams) {
  return useQuery({
    queryKey: sheetsKeys.list(params),
    queryFn: () => sheetService.getSheets(params),
    staleTime: 2 * 60 * 1000, // 2 minutes – participant counts change moderately
    gcTime: 5 * 60 * 1000,    // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

// Re-export the query key factory for use in other hooks (e.g., invalidation)
export { sheetsKeys };