import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '../utils/tokenStorage';
import apiClient from '@/shared/lib/apiClient';
import type { User } from '../types/auth.types';

const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<{ user: User }>('/users/me');
  return data.user;
};

export const useSession = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    enabled: !!tokenStorage.getToken(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const login = (provider: 'google' | 'github') => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      const existingReturnTo = localStorage.getItem('returnTo');

      if (!existingReturnTo || existingReturnTo === '/login' || existingReturnTo === '/') {
        if (!currentPath.startsWith('/login') && currentPath !== '/') {
          localStorage.setItem('returnTo', currentPath);
        }
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `${baseUrl}/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (!currentPath.startsWith('/login')) {
        localStorage.setItem('returnTo', currentPath);
      }
    }

    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear tokens
      tokenStorage.clearTokens();

      // Invalidate all user‑related queries
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });

      // Explicitly set user data to null for both auth hooks
      queryClient.setQueryData(['currentUser'], null);
      queryClient.setQueryData(['users', 'me'], null);

      // Clear entire cache
      queryClient.clear();

      // Force hard redirect to break any cookie session
      window.location.href = '/login';
    }
  };

  return {
    user: user || null,
    isLoading,
    error,
    login,
    logout,
    refetch,
    isAuthenticated: !!user,
  };
};