'use client';

import React from 'react';
import clsx from 'clsx';
import HeatmapSection from './HeatmapSection';
import FollowSection from './FollowSection';
import QuestionsList from './QuestionsList';
import StatsPanel from './StatsPanel';
import PatternsList from './PatternsList';
import RevisionsLeftCard from './RevisionsLeftCard';
import GroupsList from './GroupsList';
import NotificationsList from './NotificationsList';

import ProfileHeader from './ProfileHeader';
import type { User } from '@/shared/types';

import styles from './UserPageWrapper.module.css';

export interface UserPageWrapperProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
}

export const UserPageWrapper: React.FC<UserPageWrapperProps> = ({
  user,
  isOwnProfile = false,
  className,
}) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {/* Header */}
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      {/* Heatmap */}
      <section className={styles.section}>
        <HeatmapSection />
      </section>

      {/* Followers / Following – two columns on desktop */}
      <div className={styles.twoColumns}>
        <FollowSection />
        <FollowSection />
      </div>

      {/* Milestones + Stats – two columns */}
      <div className={styles.twoColumns}>
        <QuestionsList />
        <StatsPanel />
      </div>

      {/* Patterns + Revisions – two columns */}
      <div className={styles.twoColumns}>
        <PatternsList />
        <RevisionsLeftCard />
      </div>

      {/* Study Groups + Notifications – two columns */}
      <div className={styles.twoColumns}>
        <GroupsList />
        <NotificationsList />
      </div>
    </div>
  );
};

export default UserPageWrapper;