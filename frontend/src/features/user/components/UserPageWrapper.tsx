'use client';

import React from 'react';
import clsx from 'clsx';

import ProfileHeader from './ProfileHeader';
import HeatmapSection from './HeatmapSection';
import PatternsList from './PatternsList';
import QuestionsList from './QuestionsList';
import RecentActivitySection from './RecentActivitySection';
import StatsPanel from './StatsPanel';
import FollowSection from './FollowSection';
import GroupsList from './GroupsList';
import NotificationsList from './NotificationsList';

import type { User } from '@/shared/types';
import type { HeatmapData, PublicProgressItem, PatternMastery } from '@/shared/types';
import type { PublicStudyGroup } from '@/features/studyGroup/types/studyGroup.types';
import type { UserStats } from '@/features/user/types/userStats.types';
import type { GroupListResponse } from '@/features/studyGroup/types/studyGroup.types';

import styles from './UserPageWrapper.module.css';

export interface UserPageWrapperProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
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
      {/* Header */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Heatmap */}
      <section className={styles.section}>
        <HeatmapSection
          user={user}
          isOwnProfile={isOwnProfile}
          initialData={initialHeatmap}
        />
      </section>

      {/* Patterns */}
      <div className={styles.section}>
        <PatternsList
          userId={user._id}
          isOwnProfile={isOwnProfile}
          limit={4}
          initialPatterns={initialPatterns}
        />
      </div>

      {/* Three columns: Questions, Activity, Stats */}
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

      {/* Own profile only: Notifications */}
      {isOwnProfile && (
        <div className={styles.section}>
          <NotificationsList isOwnProfile={isOwnProfile} limit={5} />
        </div>
      )}

      {/* Two columns: Followers & Groups */}
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