'use client';

import { FiTarget, FiCheckCircle } from 'react-icons/fi';
import StatCard from '@/shared/components/StatCard';
import styles from './HeroStats.module.css';

interface HeroStatsProps {
  totalGoals: number;
  completionRate: number;
  isLoading?: boolean;
}

export default function HeroStats({ totalGoals, completionRate, isLoading }: HeroStatsProps) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StatCard
        label="total goals"
        value={totalGoals}
        icon={<FiTarget />}
        size="sm"
        className={styles.statCard}
      />
      <StatCard
        label="completion rate"
        value={`${Math.round(completionRate)}%`}
        icon={<FiCheckCircle />}
        size="sm"
        className={styles.statCard}
      />
    </div>
  );
}