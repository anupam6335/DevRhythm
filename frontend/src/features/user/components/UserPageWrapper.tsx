'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import clsx from 'clsx';

// Critical components – imported normally
import ProfileHeader from './ProfileHeader';
import HeatmapSection from './HeatmapSection';
import PatternsList from './PatternsList';
import QuestionsList from './QuestionsList';
import StatsPanel from './StatsPanel';

// Non‑critical components – lazy loaded with ssr: false
const RecentActivitySection = dynamic(() => import('./RecentActivitySection'), { ssr: false });
const FollowSection = dynamic(() => import('./FollowSection'), { ssr: false });
const GroupsList = dynamic(() => import('./GroupsList'), { ssr: false });
const NotificationsList = dynamic(() => import('./NotificationsList'), { ssr: false });

import type { User } from '@/shared/types';
import type { HeatmapData, PublicProgressItem, PatternMastery } from '@/shared/types';
import type { UserStats } from '@/features/user/types/userStats.types';
import type { GroupListResponse } from '@/features/studyGroup/types/studyGroup.types';

import styles from './UserPageWrapper.module.css';

export interface UserPageWrapperProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
  // Optional initial data for public profiles (server‑fetched)
  initialHeatmap?: HeatmapData | null;
  initialProgress?: PublicProgressItem[];
  initialGroups?: GroupListResponse | null;
  initialPatterns?: PatternMastery[];
  initialDetailedStats?: UserStats | null;
}

export const UserPageWrapper: React.FC<UserPageWrapperProps> = ({
  user,
  isOwnProfile = false,
  className,
  initialHeatmap,
  initialProgress,
  initialGroups,
  initialPatterns,
  initialDetailedStats,
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {/* Header – critical */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Heatmap – critical */}
      <section className={styles.section}>
        <HeatmapSection
          user={user}
          isOwnProfile={isOwnProfile}
          initialData={initialHeatmap}
        />
      </section>

      {/* Patterns – critical */}
      <div className={styles.section}>
        <PatternsList
          userId={user._id}
          isOwnProfile={isOwnProfile}
          limit={4}
          initialPatterns={initialPatterns}
        />
      </div>

      {/* Three columns: Questions, Activity, Stats – Questions and Stats are critical, Activity is lazy */}
      <div className={styles.threeColumns}>
        <QuestionsList
          userId={user._id}
          isOwnProfile={isOwnProfile}
          limit={6}
          initialProgress={initialProgress}
        />
        <RecentActivitySection
          userId={user._id}
          isOwnProfile={isOwnProfile}
          limit={5}
        />
        <StatsPanel
          user={user}
          isOwnProfile={isOwnProfile}
          initialStats={initialDetailedStats}
        />
      </div>

      {/* Own profile only: Notifications – lazy */}
      {isOwnProfile && (
        <div className={styles.section}>
          <NotificationsList isOwnProfile={isOwnProfile} limit={5} />
        </div>
      )}

      {/* Two columns: Followers & Groups – both lazy */}
      <div className={styles.twoColumns}>
        <FollowSection user={user} isOwnProfile={isOwnProfile} />
        <GroupsList
          userId={user._id}
          isOwnProfile={isOwnProfile}
          limit={5}
          initialGroups={initialGroups}
        />
      </div>
    </div>
  );
};

export default UserPageWrapper;