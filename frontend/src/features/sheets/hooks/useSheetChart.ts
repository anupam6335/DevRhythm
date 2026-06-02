import { useQuery } from '@tanstack/react-query';
import { sheetService } from '../services/sheetsService';
import type { ProgressChartData } from '../types/sheets.types';

/**
 * Hook to fetch chart data (combined solved + revision progress) for a user in a sheet.
 * If username is provided, fetches for that user; otherwise fetches for the current user.
 * @param slug - The sheet slug
 * @param username - Optional username (omit for current user)
 * @returns React Query result with data, isLoading, error, refetch
 */
export function useSheetChart(slug: string, username?: string) {
  const isCurrentUser = !username;

  return useQuery({
    queryKey: ['sheets', 'detail', slug, 'chart', username ?? 'me'],
    queryFn: () => {
      if (isCurrentUser) {
        return sheetService.getMyProgressChart(slug);
      }
      return sheetService.getUserProgressChart(slug, username);
    },
    enabled: !!slug,
    staleTime: 1 * 60 * 1000, // 1 minute – progress updates frequently
    gcTime: 3 * 60 * 1000,
  });
}

// Re-export query key for invalidation
export const sheetChartKey = (slug: string, username?: string) => [
  'sheets',
  'detail',
  slug,
  'chart',
  username ?? 'me',
];