import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from '../page.module.css';

export const PatternDashboardSkeleton = () => {
  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.statCardSkeleton} />
        ))}
      </div>
      <div className={styles.heroArea}>
        <SkeletonLoader variant="custom" className={styles.strongestCardSkeleton} />
        <SkeletonLoader variant="custom" className={styles.weakestCardSkeleton} />
      </div>
      <div className={styles.listHeader}>
        <SkeletonLoader variant="text" width={200} height={24} />
      </div>
      <div className={styles.patternList}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.patternRowSkeleton} />
        ))}
      </div>
    </div>
  );
};