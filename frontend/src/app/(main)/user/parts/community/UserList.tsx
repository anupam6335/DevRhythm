'use client';

import React, { useState, useCallback } from 'react';
import type { RawUser } from '@/features/community/types/community.types';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import EmptyState from '@/shared/components/EmptyState';
import { FiUsers } from 'react-icons/fi';
import UserCard from './UserCard';
import styles from './CommunityPage.module.css';

interface UserListProps {
  users: RawUser[];
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  onRetry?: () => void;
}

function UserList({ users, isLoading, error, isAuthenticated, onRetry }: UserListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const skeletonCount = 5;

  const handleCardClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setSelectedUserId(null);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.userList}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonLoader key={i} variant="user-card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load community"
        description={error.message || 'Something went wrong while fetching users.'}
        icon={<FiUsers size={48} />}
        action={
          onRetry ? (
            <button onClick={onRetry} className={styles.retryButton}>
              Try again
            </button>
          ) : undefined
        }
      />
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="Try adjusting your search or filters to find more coders."
        icon={<FiUsers size={48} />}
      />
    );
  }

  return (
    <div className={`${styles.userList} ${selectedUserId ? styles.hasSelected : ''}`}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          isAuthenticated={isAuthenticated}
          isSelected={selectedUserId === user.id}
          onCardClick={handleCardClick}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}
    </div>
  );
}

export default React.memo(UserList);