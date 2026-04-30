'use client';

import Link from 'next/link';
import Card from '@/shared/components/Card';
import ProgressBar from '@/shared/components/ProgressBar';
import { ROUTES } from '@/shared/config';
import type { DashboardSummary, GoalsData } from '@/features/dashboard';
import styles from './HeroSummary.module.css';

interface HeroSummaryProps {
  summary: DashboardSummary;
  goals: GoalsData['current'];
}

export default function HeroSummary({ summary, goals }: HeroSummaryProps) {
  const dailyGoal = goals.daily;
  const weeklyGoal = goals.weekly;

  const dailyPercentage = dailyGoal?.completionPercentage ?? 0;
  const weeklyPercentage = weeklyGoal?.completionPercentage ?? 0;

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.visuallyHidden}>Summary</h2>
        <Link href={ROUTES.QUESTIONS.ROOT} className={styles.viewAllLink}>
          View All →
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{summary.totalSolved.toLocaleString()}</span>
          <span className={styles.statLabel}>Total Solved</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{summary.currentStreak}</span>
          <span className={styles.statLabel}>Current Streak</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{Math.round(summary.masteryRate)}%</span>
          <span className={styles.statLabel}>Mastery Rate</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{summary.longestStreak}</span>
          <span className={styles.statLabel}>Longest Streak</span>
        </div>
      </div>

      <div className={styles.goalsSection}>
        <div className={styles.goalItem}>
          <div className={styles.goalHeader}>
            <span className={styles.goalTitle}>Daily Goal</span>
            {dailyGoal && (
              <span className={styles.goalCount}>
                {dailyGoal.completedCount} / {dailyGoal.targetCount}
              </span>
            )}
          </div>
          <ProgressBar
            value={dailyPercentage}
            max={100}
            size="md"
            showValue={false}
            rounded
          />
          <span className={styles.goalPercentage}>{dailyPercentage}%</span>
        </div>

        <div className={styles.goalItem}>
          <div className={styles.goalHeader}>
            <span className={styles.goalTitle}>Weekly Goal</span>
            {weeklyGoal && (
              <span className={styles.goalCount}>
                {weeklyGoal.completedCount} / {weeklyGoal.targetCount}
              </span>
            )}
          </div>
          <ProgressBar
            value={weeklyPercentage}
            max={100}
            size="md"
            showValue={false}
            rounded
          />
          <span className={styles.goalPercentage}>{weeklyPercentage}%</span>
        </div>
      </div>
    </Card>
  );
}