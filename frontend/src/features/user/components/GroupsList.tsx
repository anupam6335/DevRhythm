"use client"
import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { FiUsers, FiClock, FiLock, FiGlobe, FiMail } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

import { AvatarGroup, Avatar } from '@/shared/components/Avatar';
import Badge from '@/shared/components/Badge';
import Button from '@/shared/components/Button';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import Tooltip from '@/shared/components/Tooltip';
import NoRecordFound from '@/shared/components/NoRecordFound';

import styles from './GroupsList.module.css';
import { useUserGroups } from '@/features/studyGroup/hooks/useUserGroups';

export interface GroupsListProps {
  userId?: string;
  isOwnProfile?: boolean;
  limit?: number;
  className?: string;
}

// Helper to get privacy icon and Badge variant
const privacyConfig = {
  public: { icon: <FiGlobe />, label: 'public', variant: 'moss' },
  private: { icon: <FiLock />, label: 'private', variant: 'error' },
  'invite-only': { icon: <FiMail />, label: 'invite only', variant: 'warning' },
};

// Helper to format relative time
const formatRelativeTime = (dateStr: string): string => {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'some time ago';
  }
};

const GroupsList: React.FC<GroupsListProps> = ({
  userId,
  isOwnProfile = false,
  limit = 5,
  className,
}) => {
  const { data, isLoading, error } = useUserGroups(userId, isOwnProfile, limit);

  // Loading state
  if (isLoading) {
    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Study Groups</h2>
          <SkeletonLoader variant="text" width={80} height={24} />
        </div>
        <div className={styles.grid}>
          {[...Array(2)].map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={clsx(styles.container, styles.error, className)}>
        <p>Could not load groups</p>
      </div>
    );
  }

  const groups = data?.groups ?? [];
  const pagination = data?.pagination;

  // Empty state
  if (groups.length === 0) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Study Groups</h2>
          {isOwnProfile && (
            <Link href="/groups/create" passHref>
              <Button variant="ghost" size="md">
                create group
              </Button>
            </Link>
          )}
        </div>
        <NoRecordFound
          message={
            isOwnProfile
              ? 'You haven’t joined any study groups yet.'
              : 'Not part of any study groups yet.'
          }
          icon={<FiUsers className={styles.emptyIcon} />}
        />
        {isOwnProfile && (
          <Link href="/groups" className={styles.findGroupsLink}>
            find groups →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Study Groups</h2>
        <Link
          href={isOwnProfile ? '/groups' : `/users/${userId}/groups`}
          className={styles.viewAll}
        >
          View All →
        </Link>
      </div>

      <div className={styles.grid}>
        {groups.map((group: any) => {
          // Determine if it's a public simplified group or full group
          const isPublicView = 'memberCount' in group;
          const privacy = privacyConfig[group.privacy] || privacyConfig['invite-only'];

          // Member avatars (if available)
          let memberCount = isPublicView ? group.memberCount : group.members.length;
          let membersList = isPublicView ? [] : group.members.slice(0, 8).map((m: any) => m.userId);

          return (
            <Link key={group._id} href={`/groups/${group._id}`} className={styles.cardLink}>
              <div className={styles.card}>
                {/* Header: name + privacy badge */}
                <div className={styles.cardHeader}>
                  <h3 className={styles.groupName}>{group.name}</h3>
                  <Badge
                    variant={privacy.variant}
                    size="sm"
                    icon={privacy.icon}
                    className={styles.privacyBadge}
                  >
                    {privacy.label}
                  </Badge>
                </div>

                {/* Description */}
                {group.description && (
                  <p className={styles.description}>
                    {group.description.length > 100
                      ? group.description.slice(0, 100) + '…'
                      : group.description}
                  </p>
                )}

                {/* Member avatars row */}
                <div className={styles.membersRow}>
                  {isPublicView ? (
                    <div className={styles.memberCount}>
                      <FiUsers className={styles.memberIcon} />
                      <span>
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <>
                      <AvatarGroup max={5} size="sm" className={styles.avatarGroup}>
                        {membersList.map((user: any) => (
                          <Tooltip key={user._id} content={user.displayName || user.username}>
                            <Avatar
                              src={user.avatarUrl}
                              name={user.displayName || user.username}
                              size="sm"
                            />
                          </Tooltip>
                        ))}
                      </AvatarGroup>
                      {memberCount > 5 && (
                        <span className={styles.extraCount}>+{memberCount - 5}</span>
                      )}
                    </>
                  )}
                </div>

                {/* Own profile only: active goal/challenge */}
                {isOwnProfile && !isPublicView && (
                  <div className={styles.activity}>
                    {(() => {
                      // Find first active goal or challenge
                      const activeGoal = group.goals?.find(
                        (g: any) =>
                          g.status === 'active' &&
                          g.participants.some((p: any) => p.userId._id === userId)
                      );
                      const activeChallenge = group.challenges?.find(
                        (c: any) =>
                          c.status === 'active' &&
                          c.participants.some((p: any) => p.userId._id === userId)
                      );

                      if (activeGoal) {
                        const participant = activeGoal.participants.find(
                          (p: any) => p.userId._id === userId
                        );
                        const progress = participant?.progress ?? 0;
                        return (
                          <div className={styles.goalPill}>
                            <span className={styles.goalIcon}>🎯</span>
                            <span className={styles.goalText}>
                              {progress}/{activeGoal.targetCount}{' '}
                              {activeGoal.description.slice(0, 20)}…
                            </span>
                          </div>
                        );
                      }
                      if (activeChallenge) {
                        const participant = activeChallenge.participants.find(
                          (p: any) => p.userId._id === userId
                        );
                        const progress = participant?.progress ?? 0;
                        return (
                          <div className={styles.goalPill}>
                            <span className={styles.goalIcon}>⚡</span>
                            <span className={styles.goalText}>
                              {progress}% {activeChallenge.name.slice(0, 20)}…
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}

                {/* Footer: last activity */}
                <div className={styles.footer}>
                  <FiClock className={styles.footerIcon} />
                  <span className={styles.footerText}>
                    last active {formatRelativeTime(group.lastActivityAt)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsList;
