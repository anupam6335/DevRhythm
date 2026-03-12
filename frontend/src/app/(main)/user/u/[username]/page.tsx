'use client';

import { use } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserPageWrapper } from '@/features/user/components';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OwnUserPage({ params }: { params: Promise<{ username: string }> }) {
  // Unwrap params even if not used, to comply with Next.js requirements.
  use(params);

  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <SkeletonLoader variant="user-card" count={3} />
      </div>
    );
  }

  if (!user) {
    return null; // will redirect
  }

  return <UserPageWrapper user={user} isOwnProfile={true} />;
}