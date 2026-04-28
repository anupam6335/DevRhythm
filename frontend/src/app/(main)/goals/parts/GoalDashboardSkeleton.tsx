import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './GoalDashboardSkeleton.module.css';

export function GoalDashboardSkeleton() {
  return (
    <div className={styles.container}>
      {/* Daily Problem Card Skeleton */}
      <div className={styles.dailyProblemSkeleton} />

      {/* Hero Stats */}
      <div className={styles.heroStats}>
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.heroCard} />
        ))}
      </div>

      {/* Current Momentum (rings) */}
      <div className={styles.momentum}>
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.momentumCard} />
        ))}
      </div>

      {/* Trends Charts */}
      <div className={styles.charts}>
        <SkeletonLoader variant="custom" className={styles.chartCard} />
        <SkeletonLoader variant="custom" className={styles.chartCard} />
      </div>

      {/* Planned Goals */}
      <SkeletonLoader variant="custom" className={styles.plannedSection} />

      {/* History */}
      <SkeletonLoader variant="custom" className={styles.historySection} />
    </div>
  );
}