import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { FiUsers, FiUserPlus } from 'react-icons/fi';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { useFollowData } from '../hooks/useFollowData';
import { Avatar, AvatarGroup } from '@/shared/components/Avatar';
import Button from '@/shared/components/Button';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import Tooltip from '@/shared/components/Tooltip';
import { ROUTES } from '@/shared/config/routes';
import type { User } from '@/shared/types';

import styles from './FollowSection.module.css';

export interface FollowSectionProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
}

const getUserName = (user: User) => user.displayName || user.username;

const FollowSection: React.FC<FollowSectionProps> = ({
  user,
  isOwnProfile = false,
  className,
}) => {
  const { user: currentUser } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 940px)');

  const avatarMax = 3;

  const currentUserId = currentUser?._id;
  const { followers, following, mutuals, isLoading, error } = useFollowData({
    userId: user?._id ?? '',
    isOwnProfile,
    currentUserId,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.header}>
          <SkeletonLoader variant="text" width={120} height={24} />
          <SkeletonLoader variant="text" width={100} height={32} />
        </div>
        <div className={styles.content}>
          <SkeletonLoader variant="text" width={200} height={40} />
          <SkeletonLoader variant="text" width={200} height={40} />
          <SkeletonLoader variant="text" width={200} height={40} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(styles.container, styles.error, className)}>
        <FiUsers size={32} />
        <p>Could not load connections</p>
      </div>
    );
  }

  const hasFollowers = followers.count > 0;
  const hasFollowing = following.count > 0;
  const hasMutuals = mutuals.count > 0;

  if (!hasFollowers && !hasFollowing) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Connections</h2>
          <Link href={`/users/${user.username}/connections`} passHref className={styles.viewall}>
            <Button variant="ghost" size="sm">
              View Connections →
            </Button>
          </Link>
        </div>
        <div className={styles.emptyState}>
          <FiUserPlus className={styles.emptyIcon} />
          <p>no connections yet</p>
          {isOwnProfile && (
            <Link href={ROUTES.SEARCH.USERS} className={styles.findPeopleLink}>
              find people
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Connections</h2>
        <Link href={`/users/${user.username}/connections`} passHref className={styles.viewall}>
          <Button variant="ghost" size="sm">
            View Connections →
          </Button>
        </Link>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Two‑column grid for followers & following */}
        <div className={styles.twoColumns}>
          {/* Followers block */}
          <div className={styles.block}>
            <div className={styles.blockHeader}>
              <span className={styles.blockLabel}>Followers</span>
              <span className={styles.blockNumber}>{followers.count.toLocaleString()}</span>
            </div>
            {hasFollowers ? (
              <div className={styles.avatarRow}>
                <AvatarGroup max={avatarMax} size={isDesktop ? 'sm' : 'xs'}>
                  {followers.list.slice(0, 10).map((follower: User) => {
                    const isCurrentUser = follower._id === currentUserId;
                    return (
                      <Tooltip key={follower._id} content={getUserName(follower)}>
                        <Link
                          href={
                            isCurrentUser
                              ? ROUTES.USER_PROFILE.OWN(follower.username)
                              : ROUTES.USER_PROFILE.PUBLIC(follower.username)
                          }
                        >
                          <Avatar
                            src={follower.avatarUrl}
                            name={getUserName(follower)}
                            size={isDesktop ? 'sm' : 'xs'}
                          />
                        </Link>
                      </Tooltip>
                    );
                  })}
                </AvatarGroup>
              </div>
            ) : (
              <p className={styles.emptyMessage}>no followers yet</p>
            )}
          </div>

          {/* Following block */}
          <div className={styles.block}>
            <div className={styles.blockHeader}>
              <span className={styles.blockLabel}>Following</span>
              <span className={styles.blockNumber}>{following.count.toLocaleString()}</span>
            </div>
            {hasFollowing ? (
              <div className={styles.avatarRow}>
                <AvatarGroup max={avatarMax} size={isDesktop ? 'sm' : 'xs'}>
                  {following.list.slice(0, 10).map((followed: User) => {
                    const isCurrentUser = followed._id === currentUserId;
                    return (
                      <Tooltip key={followed._id} content={getUserName(followed)}>
                        <Link
                          href={
                            isCurrentUser
                              ? ROUTES.USER_PROFILE.OWN(followed.username)
                              : ROUTES.USER_PROFILE.PUBLIC(followed.username)
                          }
                        >
                          <Avatar
                            src={followed.avatarUrl}
                            name={getUserName(followed)}
                            size={isDesktop ? 'sm' : 'xs'}
                          />
                        </Link>
                      </Tooltip>
                    );
                  })}
                </AvatarGroup>
              </div>
            ) : (
              <p className={styles.emptyMessage}>not following anyone yet</p>
            )}
          </div>
        </div>

        {/* Mutuals block – only if exists */}
        {hasMutuals && (
          <div className={clsx(styles.block, styles.mutualsBlock)}>
            <div className={styles.blockHeader}>
              <span className={styles.blockLabel}>Mutuals</span>
              <span className={styles.blockNumber}>{mutuals.count.toLocaleString()}</span>
            </div>
            <div className={styles.avatarRow}>
              <AvatarGroup max={avatarMax} size={isDesktop ? 'sm' : 'xs'}>
                {mutuals.list.slice(0, 10).map((mutual: User) => {
                  const isCurrentUser = mutual._id === currentUserId;
                  return (
                    <Tooltip key={mutual._id} content={getUserName(mutual)}>
                      <Link
                        href={
                          isCurrentUser
                            ? ROUTES.USER_PROFILE.OWN(mutual.username)
                            : ROUTES.USER_PROFILE.PUBLIC(mutual.username)
                        }
                      >
                        <Avatar
                          src={mutual.avatarUrl}
                          name={getUserName(mutual)}
                          size={isDesktop ? 'sm' : 'xs'}
                        />
                      </Link>
                    </Tooltip>
                  );
                })}
              </AvatarGroup>
            </div>
          </div>
        )}

        {/* If no mutuals but there are some connections, show a subtle message */}
        {(hasFollowers || hasFollowing) && !hasMutuals && (
          <div className={styles.noMutuals}>
            <span className={styles.noMutualsText}>no mutuals yet</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowSection;