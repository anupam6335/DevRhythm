import { useQuery } from '@tanstack/react-query';
import { sheetService } from '../services/sheetsService';
import type { UserSheetProgress } from '../types/sheets.types';

/**
 * Hook to fetch the current user's progress within a sheet.
 * Requires authentication; returns null if user hasn't joined or sheet doesn't exist.
 * @param slug - The sheet slug
 * @returns React Query result with data, isLoading, error, refetch
 */
export function useSheetProgress(slug: string) {
  return useQuery({
    queryKey: ['sheets', 'detail', slug, 'progress', 'me'],
    queryFn: () => sheetService.getMyProgress(slug),
    enabled: !!slug,
    staleTime: 1 * 60 * 1000, // 1 minute – progress updates frequently
    gcTime: 3 * 60 * 1000,
  });
}

// Re-export query key for invalidation
export const sheetProgressKey = (slug: string) => ['sheets', 'detail', slug, 'progress', 'me'];