'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokenStorage } from '../utils/tokenStorage';
import { useSession } from '../hooks/useSession';

export const AuthCallbackHandler: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (token && refreshToken && userId) {
      tokenStorage.setTokens(token, refreshToken, userId);
      refetch().then(() => {
        const returnTo = localStorage.getItem('returnTo');
        // Avoid redirecting to login or home
        if (returnTo && returnTo !== '/login' && returnTo !== '/') {
          localStorage.removeItem('returnTo');
          router.push(returnTo);
        } else {
          localStorage.removeItem('returnTo');
          router.push('/dashboard');
        }
      });
    } else {
      setError('Invalid authentication response');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, router, refetch]);

  if (error) {
    return (
      <div className="callback-error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="callback-loading">
      <h2>Completing authentication...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
};