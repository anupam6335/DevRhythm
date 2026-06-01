'use client';

import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './UserProgressSkeleton.module.css';

export default function UserProgressSkeleton() {
  return (
    <div className={styles.container}>
      {/* Header skeleton */}
      <div className={styles.headerSkeleton}>
        <SkeletonLoader variant="text" width="40%" height={32} />
        <SkeletonLoader variant="text" width="20%" height={20} />
        <div className={styles.statsRowSkeleton}>
          <SkeletonLoader variant="text" width="100px" height={40} />
          <SkeletonLoader variant="text" width="100px" height={40} />
          <SkeletonLoader variant="text" width="100px" height={40} />
        </div>
      </div>

      {/* Chart skeleton */}
      <div className={styles.chartSkeleton}>
        <SkeletonLoader variant="custom" className={styles.chartCircle} />
      </div>

      {/* Questions list skeleton */}
      <div className={styles.questionsSkeleton}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.questionSkeleton}>
            <SkeletonLoader variant="text" width="70%" height={20} />
            <SkeletonLoader variant="text" width="50%" height={16} />
          </div>
        ))}
      </div>
    </div>
  );
}