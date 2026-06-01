import { useQuery } from '@tanstack/react-query';
import { sheetService } from '../services/sheetsService';
import type { UserProgress } from '../types/sheets.types';

/**
 * Hook to fetch another user's progress within a sheet.
 * @param slug - The sheet slug
 * @param username - The username of the target user
 * @returns React Query result with data, isLoading, error, refetch
 */
export function useUserProgress(slug: string, username: string) {
  return useQuery({
    queryKey: ['sheets', 'detail', slug, 'progress', username],
    queryFn: () => sheetService.getUserProgress(slug, username),
    enabled: !!slug && !!username,
    staleTime: 1 * 60 * 1000, // 1 minute – progress updates frequently
    gcTime: 3 * 60 * 1000,
  });
}

// Re-export query key for invalidation
export const userProgressKey = (slug: string, username: string) => [
  'sheets',
  'detail',
  slug,
  'progress',
  username,
];