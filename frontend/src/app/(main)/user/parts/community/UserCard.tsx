'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/shared/components/Avatar';
import Badge from '@/shared/components/Badge';
import type { RawUser } from '@/features/community/types/community.types';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: RawUser;
  isAuthenticated: boolean;
  isSelected: boolean;
  onCardClick: (userId: string) => void;
  onAnimationComplete: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

const formatTime = (minutes: number): string => {
  if (minutes === 0) return '0h';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

function UserCard({
  user,
  isAuthenticated,
  isSelected,
  onCardClick,
  onAnimationComplete,
}: UserCardProps) {
  const router = useRouter();
  const [animationState, setAnimationState] = useState<'idle' | 'expanding'>('idle');
  const mastery = Math.round(user.masteryRate);
  const solvedFormatted = formatNumber(user.totalSolved);
  const timeFormatted = formatTime(user.totalTimeSpent);
  const profileUrl = `/user/${user.username}`;

  const followingBadge = user.iFollow ? (
    <Badge key="following" variant="moss" size="sm" className={styles.badge}>
      Following
    </Badge>
  ) : null;

  const followsYouBadge = user.followsMe ? (
    <Badge key="follows-you" variant="sand" size="sm" className={styles.badge}>
      Follows you
    </Badge>
  ) : null;

  const mobileBadges = [followingBadge, followsYouBadge].filter(Boolean);

  const handleClick = () => {
    if (animationState !== 'idle') return;
    onCardClick(user.id);
    setAnimationState('expanding');

    setTimeout(() => {
      setAnimationState('idle');
      setTimeout(() => {
        onAnimationComplete();
        router.push(profileUrl);
      }, 50);
    }, 400);
  };

  const cardVariants = {
    idle: { scale: 1, opacity: 1, y: 0 },
    expanding: {
      scale: 1.05,
      transition: { type: 'spring', stiffness: 300, damping: 25 } as const,
    },
  };

  return (
    <motion.div
      className={styles.cardLink}
      variants={cardVariants}
      animate={animationState}
      initial="idle"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      data-selected={isSelected ? 'true' : 'false'}
      layout
    >
      <div className={styles.userCard}>
        <Avatar
          src={user.avatarUrl}
          name={user.displayName || user.username}
          size="md"
          status={user.isOnline ? 'online' : 'offline'}
          className={styles.avatar}
          alt={user.displayName || user.username}
        />

        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.displayName}</div>
          <div className={styles.userUsername}>@{user.username}</div>
          {mobileBadges.length > 0 && (
            <div className={styles.mobileBadges}>{mobileBadges}</div>
          )}
        </div>

        {/* Desktop stats – hidden when expanded */}
        {animationState === 'idle' && (
          <div className={styles.statsDesktop}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{solvedFormatted}</span>
              <span className={styles.statLabel}>Solved</span>
            </div>
            <div className={styles.stat}>
              <div className={styles.masteryWrapper}>
                <div className={styles.masteryBar}>
                  <div className={styles.masteryFill} style={{ width: `${mastery}%` }} />
                </div>
                <span className={styles.statValue}>{mastery}%</span>
              </div>
              <span className={styles.statLabel}>Mastery</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{timeFormatted}</span>
              <span className={styles.statLabel}>Time</span>
            </div>
            {followingBadge}
            {followsYouBadge}
          </div>
        )}

        {/* Expanded stats – shown only during expansion */}
        {animationState === 'expanding' && (
          <div className={styles.expandedStats}>
            <div className={styles.expandedContent}>
              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{solvedFormatted}</span>
                  <span className={styles.statLabel}>Solved</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{mastery}%</span>
                  <span className={styles.statLabel}>Mastery</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{timeFormatted}</span>
                  <span className={styles.statLabel}>Time</span>
                </div>
              </div>
              <div className={styles.loadingShimmer} />
            </div>
          </div>
        )}

        {/* Mobile stats */}
        {animationState === 'idle' && (
          <div className={styles.statsMobile}>
            <div className={styles.statsTopRow}>
              <div className={styles.mobileStatItem}>
                <span className={styles.statValue}>{solvedFormatted}</span>
                <span className={styles.statLabel}>solved</span>
              </div>
              <div className={styles.mobileStatItem}>
                <span className={styles.statValue}>{timeFormatted}</span>
              </div>
            </div>
            <hr className={styles.separatorLine} />
            <div className={styles.mobileMastery}>
              <span className={styles.statValue}>{mastery}%</span>
              <span className={styles.statLabel}>mastery</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default React.memo(UserCard);