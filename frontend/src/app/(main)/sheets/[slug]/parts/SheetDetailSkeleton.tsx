'use client';

import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './SheetDetailSkeleton.module.css';

export default function SheetDetailSkeleton() {
  return (
    <div className={styles.container}>
      {/* Hero skeleton */}
      <div className={styles.heroSkeleton}>
        <SkeletonLoader variant="text" width="60%" height={32} />
        <SkeletonLoader variant="text" width="90%" height={80} />
        <div className={styles.metadataSkeleton}>
          <SkeletonLoader variant="text" width="30%" height={20} />
          <SkeletonLoader variant="text" width="20%" height={20} />
        </div>
        <div className={styles.participantsSkeleton}>
          <SkeletonLoader variant="text" width="40%" height={20} />
          <div className={styles.avatarGroupSkeleton}>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} variant="custom" width={40} height={40} />
            ))}
          </div>
        </div>
      </div>

      {/* Progress chart skeleton (if joined) */}
      <div className={styles.chartSkeleton}>
        <SkeletonLoader variant="text" width="30%" height={24} />
        <div className={styles.statsRowSkeleton}>
          <SkeletonLoader variant="text" width="120px" height={40} />
          <SkeletonLoader variant="text" width="120px" height={40} />
          <SkeletonLoader variant="text" width="120px" height={40} />
        </div>
        <SkeletonLoader variant="custom" className={styles.chartCircle} />
      </div>

      {/* Question groups skeleton */}
      <div className={styles.groupsSkeleton}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={styles.groupSkeleton}>
            <SkeletonLoader variant="text" width="40%" height={28} />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className={styles.questionSkeleton}>
                <SkeletonLoader variant="text" width="70%" height={20} />
                <SkeletonLoader variant="text" width="50%" height={16} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}