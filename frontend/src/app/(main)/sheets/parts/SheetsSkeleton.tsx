'use client';

import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './SheetsSkeleton.module.css';

interface SheetsSkeletonProps {
  count?: number;
}

export default function SheetsSkeleton({ count = 5 }: SheetsSkeletonProps) {
  return (
    <div className={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <SkeletonLoader variant="text" width="60%" height={24} />
            <SkeletonLoader variant="custom" width={80} height={32} />
          </div>
          <SkeletonLoader variant="text" width="90%" height={40} />
          <div className={styles.skeletonMetadata}>
            <SkeletonLoader variant="text" width="40%" height={16} />
            <SkeletonLoader variant="text" width="30%" height={16} />
          </div>
          <div className={styles.skeletonParticipants}>
            <SkeletonLoader variant="text" width="30%" height={16} />
            <div className={styles.skeletonAvatars}>
              <SkeletonLoader variant="custom" width={32} height={32} />
              <SkeletonLoader variant="custom" width={32} height={32} />
              <SkeletonLoader variant="custom" width={32} height={32} />
              <SkeletonLoader variant="custom" width={32} height={32} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}