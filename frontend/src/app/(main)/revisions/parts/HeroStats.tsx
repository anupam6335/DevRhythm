'use client';

import { FiActivity, FiCheckCircle, FiTrendingUp, FiClock } from 'react-icons/fi';
import StatCard from '@/shared/components/StatCard';
import styles from './HeroStats.module.css';

interface HeroStatsProps {
  stats: {
    totalActiveSchedules: number;
    completionRate: number;
    completionRateChange?: number; // e.g., +5 or -2
    revisionStreak: { current: number; change?: number };
    totalOverdueSchedules: number;
    overdueChange?: number;
  };
}

export default function HeroStats({ stats }: HeroStatsProps) {
  return (
    <div className={styles.container}>
      <StatCard
        label="active schedules"
        value={stats.totalActiveSchedules}
        icon={<FiActivity />}
        size="sm"
        className={styles.compactStatCard}
        trend={{
          value: 0, // no trend for active schedules
          direction: 'neutral',
          label: 'vs last week',
        }}
      />
      <StatCard
        label="completion rate"
        value={`${stats.completionRate}%`}
        icon={<FiCheckCircle />}
        size="sm"
        className={styles.compactStatCard}
        trend={{
          value: Math.abs(stats.completionRateChange || 0),
          direction: (stats.completionRateChange || 0) >= 0 ? 'up' : 'down',
          label: 'vs last week',
        }}
      />
      <StatCard
        label="day streak"
        value={stats.revisionStreak.current}
        icon={<FiTrendingUp />}
        size="sm"
        className={styles.compactStatCard}
        trend={{
          value: Math.abs(stats.revisionStreak.change || 0),
          direction: (stats.revisionStreak.change || 0) >= 0 ? 'up' : 'down',
          label: 'vs last week',
        }}
      />
      <StatCard
        label="overdue schedules"
        value={stats.totalOverdueSchedules}
        icon={<FiClock />}
        size="sm"
        className={styles.compactStatCard}
        trend={{
          value: Math.abs(stats.overdueChange || 0),
          direction: (stats.overdueChange || 0) <= 0 ? 'down' : 'up', // decrease is good
          label: 'vs last week',
        }}
      />
    </div>
  );
}