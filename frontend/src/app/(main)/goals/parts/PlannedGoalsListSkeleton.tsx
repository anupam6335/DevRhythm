
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './PlannedGoalsList.module.css';

export function PlannedGoalsListSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Planned goals</h2>
        <div className={styles.skeletonButton} />
      </div>
      <div className={styles.list}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.skeletonItem} />
        ))}
      </div>
    </div>
  );
}