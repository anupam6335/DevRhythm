'use client';

import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './CreateSheetSkeleton.module.css';

export default function CreateSheetSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.columns}>
        {/* Left Panel Skeleton */}
        <div className={styles.leftPanel}>
          <div className={styles.card}>
            <SkeletonLoader variant="text" width="60%" height={28} />
            <div className={styles.field}>
              <SkeletonLoader variant="text" width="30%" height={16} />
              <SkeletonLoader variant="text" width="100%" height={40} />
            </div>
            <div className={styles.field}>
              <SkeletonLoader variant="text" width="30%" height={16} />
              <SkeletonLoader variant="text" width="100%" height={80} />
            </div>
            <div className={styles.field}>
              <SkeletonLoader variant="text" width="30%" height={16} />
              <SkeletonLoader variant="text" width="100%" height={40} />
            </div>
            <div className={styles.field}>
              <SkeletonLoader variant="text" width="30%" height={16} />
              <SkeletonLoader variant="text" width="100%" height={40} />
            </div>
            <div className={styles.field}>
              <SkeletonLoader variant="text" width="30%" height={16} />
              <SkeletonLoader variant="text" width="100%" height={40} />
              <SkeletonLoader variant="text" width="100%" height={40} style={{ marginTop: '0.5rem' }} />
            </div>
          </div>
        </div>

        {/* Right Panel Skeleton */}
        <div className={styles.rightPanel}>
          <div className={styles.card}>
            <SkeletonLoader variant="text" width="40%" height={28} />
            <div className={styles.searchSkeleton}>
              <SkeletonLoader variant="text" width="100%" height={40} />
            </div>
            <div className={styles.selectedSkeleton}>
              <SkeletonLoader variant="text" width="30%" height={20} />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.selectedItemSkeleton}>
                  <SkeletonLoader variant="text" width="80%" height={24} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.actions}>
        <SkeletonLoader variant="custom" width={100} height={40} />
        <SkeletonLoader variant="custom" width={120} height={40} />
      </div>
    </div>
  );
}