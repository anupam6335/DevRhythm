import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './HistoryList.module.css';

export function HistoryListSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>History</h2>
        <div className={styles.skeletonControls} />
      </div>
      <div className={styles.list}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.skeletonItem} />
        ))}
      </div>
    </div>
  );
}