'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import {
  FiBell,
  FiCheckCircle,
  FiStar,
  FiRefreshCw,
  FiTarget,
  FiUsers,
  FiCheck,
} from 'react-icons/fi';

import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
} from '@/features/notification/hooks/useNotifications';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import NoRecordFound from '@/shared/components/NoRecordFound';
import Tooltip from '@/shared/components/Tooltip';
import { ROUTES } from '@/shared/config/routes';
import type { Notification } from '@/shared/types';

import styles from './NotificationsList.module.css';

export interface NotificationsListProps {
  userId?: string;
  isOwnProfile?: boolean;
  limit?: number;
  className?: string;
}

// Map notification type to icon and optional link target
const getNotificationDetails = (notif: Notification) => {
  const { type, data } = notif;

  switch (type) {
    case 'question_solved':
      return {
        icon: <FiCheckCircle className={styles.icon} />,
        link: data?.questionId ? `/questions/${data.questionId}` : undefined,
      };
    case 'question_mastered':
      return {
        icon: <FiStar className={styles.icon} />,
        link: data?.questionId ? `/questions/${data.questionId}` : undefined,
      };
    case 'revision_completed':
      return {
        icon: <FiRefreshCw className={styles.icon} />,
        link: data?.questionId ? `/questions/${data.questionId}` : undefined,
      };
    case 'goal_completion':
      return {
        icon: <FiTarget className={styles.icon} />,
        link: data?.goalId ? `/goals/${data.goalId}` : undefined,
      };
    case 'new_follower':
      return {
        icon: <FiUsers className={styles.icon} />,
        link: data?.followerName ? ROUTES.USER_PROFILE.PUBLIC(data.followerName) : undefined,
      };
    default:
      return {
        icon: <FiBell className={styles.icon} />,
        link: undefined,
      };
  }
};

// Format relative time
const formatTime = (timestamp: string): string => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return '';
  }
};

const NotificationsList: React.FC<NotificationsListProps> = ({
  isOwnProfile = false,
  limit = 5,
  className,
}) => {
  const router = useRouter();
  const markAsReadMutation = useMarkAsRead();

  // 1. Unread notifications list (for display)
  const {
    data: unreadData,
    isLoading: unreadLoading,
    error: unreadError,
  } = useNotifications({ limit: limit * 2, page: 1, unreadOnly: true });

  // 2. Total unread count (for badge)
  const {
    data: unreadCountData,
    isLoading: countLoading,
    error: countError,
  } = useUnreadCount();

  // 3. Total notifications count (for older count) – fetch first page without filters, limit 1
  const {
    data: totalData,
    isLoading: totalLoading,
    error: totalError,
  } = useNotifications({ limit: 1, page: 1 });

  // Only render for own profile
  if (!isOwnProfile) {
    return null;
  }

  const isLoading = unreadLoading || countLoading || totalLoading;
  const error = unreadError || countError || totalError;

  const handleItemClick = (notif: Notification, e: React.MouseEvent) => {
    // If click originated from the mark‑read button, do nothing
    if ((e.target as HTMLElement).closest(`.${styles.markReadButton}`)) {
      return;
    }

    // Mark as read if unread (optimistically)
    if (!notif.readAt) {
      markAsReadMutation.mutate(notif._id);
    }

    // Navigate if there's a target
    const { link } = getNotificationDetails(notif);
    if (link) {
      router.push(link);
    }
  };

  const handleMarkRead = (notifId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(notifId);
  };

  if (isLoading) {
    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>notifications</h2>
          <span className={styles.viewAll}>loading…</span>
        </div>
        <div className={styles.list}>
          {Array.from({ length: limit }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.skeletonItem} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx(styles.container, styles.error, className)}>
        <p>Could not load notifications</p>
      </div>
    );
  }

  const unreadNotifications = unreadData?.notifications ?? [];
  const displayNotifications = unreadNotifications.slice(0, limit);

  const unreadCount = unreadCountData?.unreadCount ?? 0;
  const totalCount = totalData?.pagination?.total ?? 0;
  const olderCount = Math.max(0, totalCount - unreadCount);

  if (displayNotifications.length === 0) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Notifications</h2>
          <Link href="/notifications" className={styles.viewAll}>
            View All →
          </Link>
        </div>
        <NoRecordFound
          message="No new notifications. Check back later!"
          icon={<FiBell className={styles.emptyIcon} />}
        />
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} new</span>
          )}
        </h2>
        <Link href="/notifications" className={styles.viewAll}>
          View All →
        </Link>
      </div>

      <div className={styles.list}>
        {displayNotifications.map((notif) => {
          const { icon, link } = getNotificationDetails(notif);
          const timeAgo = formatTime(notif.createdAt);

          return (
            <div
              key={notif._id}
              className={styles.item}
              onClick={(e) => handleItemClick(notif, e)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleItemClick(notif, e as any);
                }
              }}
            >
              {/* Unread indicator (filled dot) – all displayed are unread */}
              <div className={clsx(styles.unreadDot, styles.unreadDotFilled)} />

              {/* Icon */}
              <div className={styles.iconColumn}>{icon}</div>

              {/* Content */}
              <div className={styles.contentColumn}>
                <div className={styles.message}>{notif.message}</div>
                <div className={styles.timestamp}>{timeAgo}</div>
              </div>

              {/* Right side: mark‑read button */}
              <div className={styles.rightColumn}>
                <Tooltip content="Mark as read">
                  <button
                    className={styles.markReadButton}
                    onClick={(e) => handleMarkRead(notif._id, e)}
                    aria-label="Mark as read"
                  >
                    <FiCheck />
                  </button>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: older (read) notifications count + view all */}
      {olderCount > 0 && (
        <div className={styles.footer}>
          <span className={styles.olderCount}>
            {olderCount} older notification{olderCount !== 1 ? 's' : ''}
          </span>
          <Link href="/notifications" className={styles.viewAll}>
            View All →
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;