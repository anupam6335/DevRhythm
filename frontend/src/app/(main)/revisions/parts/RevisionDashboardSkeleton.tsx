import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './RevisionDashboardSkeleton.module.css';

export const RevisionDashboardSkeleton = () => {
  return (
    <div className={styles.container}>
      <div className={styles.heroStats}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.heroCard} />
        ))}
      </div>
      <div className={styles.twoColumnCore}>
        <SkeletonLoader variant="custom" className={styles.funnelSkeleton} />
        <SkeletonLoader variant="custom" className={styles.quickStatsSkeleton} />
      </div>
      <div className={styles.rhythmSkeleton}>
        <div className={styles.rhythmHeader}>
          <SkeletonLoader variant="text" width={200} height={28} />
          <div className={styles.tabsSkeleton}>
            <SkeletonLoader variant="text" width={60} height={32} />
            <SkeletonLoader variant="text" width={60} height={32} />
            <SkeletonLoader variant="text" width={60} height={32} />
          </div>
        </div>
        <div className={styles.graphsRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.graphSkeleton} />
          ))}
        </div>
        <SkeletonLoader variant="custom" className={styles.heatmapSkeleton} />
      </div>
      <div className={styles.wisdomBoard}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.wisdomCard} />
        ))}
      </div>
      <div className={styles.actionStream}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className={styles.actionColumn}>
            <SkeletonLoader variant="custom" className={styles.actionHeader} />
            {Array.from({ length: 5 }).map((_, j) => (
              <SkeletonLoader key={j} variant="custom" className={styles.actionItem} />
            ))}
            <div className={styles.paginationSkeleton}>
              <SkeletonLoader variant="text" width={60} height={32} />
              <SkeletonLoader variant="text" width={40} height={32} />
              <SkeletonLoader variant="text" width={60} height={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};