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
    // Store the intended return path
    const returnTo = localStorage.getItem('returnTo') || '/dashboard';
    localStorage.setItem('returnTo', returnTo);
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const redirectUri = `${window.location.origin}/auth/callback`;
    window.location.href = `${baseUrl}/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      tokenStorage.clearTokens();
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      router.push('/login');
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