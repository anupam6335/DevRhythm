import { useQuery } from '@tanstack/react-query';
import { sheetService } from '../services/sheetsService';
import type { SheetDetailsResponse } from '../types/sheets.types';

/**
 * Hook to fetch a single sheet by slug.
 * @param slug - The sheet slug (URL-friendly identifier)
 * @returns React Query result with data, isLoading, error, refetch
 */
export function useSheet(slug: string) {
  return useQuery({
    queryKey: ['sheets', 'detail', slug],
    queryFn: () => sheetService.getSheetBySlug(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes – sheet metadata and participant counts can change
    gcTime: 5 * 60 * 1000,
  });
}

// Re-export the query key for invalidation if needed elsewhere
export const sheetDetailKey = (slug: string) => ['sheets', 'detail', slug];