import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './DashboardSkeleton.module.css';

export default function DashboardSkeleton() {
  return (
    <div className={styles.container}>
      {/* Hero Summary Skeleton */}
      <div className={styles.heroGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.heroCard}>
            <SkeletonLoader variant="custom" className={styles.statSkeleton} />
          </div>
        ))}
        <div className={styles.goalRow}>
          <div className={styles.goalSkeleton} />
          <div className={styles.goalSkeleton} />
        </div>
      </div>

      {/* Two-column layout for heatmap and weekly study */}
      <div className={styles.twoColumn}>
        <div className={styles.heatmapSkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCard} />
        </div>
        <div className={styles.weeklySkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCard} />
        </div>
      </div>

      {/* Goals graph and upcoming revisions */}
      <div className={styles.twoColumn}>
        <div className={styles.goalsGraphSkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCardLarge} />
        </div>
        <div className={styles.upcomingSkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCard} />
        </div>
      </div>

      {/* Active goals and daily challenge */}
      <div className={styles.twoColumn}>
        <div className={styles.activeGoalsSkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCard} />
        </div>
        <div className={styles.dailyChallengeSkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCardLarge} />
        </div>
      </div>

      {/* Pending revisions and recent activity */}
      <div className={styles.twoColumn}>
        <div className={styles.pendingSkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCard} />
        </div>
        <div className={styles.recentActivitySkeleton}>
          <SkeletonLoader variant="custom" className={styles.skeletonCard} />
        </div>
      </div>

      {/* Path of Solved (reuses existing component's skeleton) */}
      <div className={styles.fullWidth}>
        <SkeletonLoader variant="custom" className={styles.skeletonCardLarge} />
      </div>

      {/* Weakest pattern insight */}
      <div className={styles.fullWidth}>
        <SkeletonLoader variant="custom" className={styles.skeletonCard} />
      </div>
    </div>
  );
}