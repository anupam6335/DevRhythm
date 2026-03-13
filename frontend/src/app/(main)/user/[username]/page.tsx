'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/features/user/services/userService';
import { UserPageWrapper } from '@/features/user/components';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import NotFoundPage from '@/shared/components/NotFoundPage';

export default function PublicUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', username],
    queryFn: () => userService.getUserByUsername(username),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <SkeletonLoader variant="user-card" count={3} />
      </div>
    );
  }

  if (error || !user) {
    return <NotFoundPage title={`User ${username} not found`} message='Please Check the username and try again'/>;
  }

  return <UserPageWrapper user={user} isOwnProfile={false} />;
}