import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './GoalCreateSkeleton.module.css';

export default function GoalCreateSkeleton() {
  return (
    <div className={styles.container}>
      {/* Buttons skeleton */}
      <div className={styles.buttonRow}>
        <SkeletonLoader variant="custom" className={styles.buttonSkeleton} />
        <SkeletonLoader variant="custom" className={styles.buttonSkeleton} />
      </div>

      {/* Goal type selector skeleton */}
      <div className={styles.section}>
        <SkeletonLoader variant="text" width={100} height={20} />
        <div className={styles.typeButtons}>
          <SkeletonLoader variant="custom" className={styles.typeSkeleton} />
          <SkeletonLoader variant="custom" className={styles.typeSkeleton} />
          <SkeletonLoader variant="custom" className={styles.typeSkeleton} />
        </div>
      </div>

      {/* Basic info skeleton */}
      <div className={styles.section}>
        <SkeletonLoader variant="text" width={200} height={24} />
        <div className={styles.field}>
          <SkeletonLoader variant="text" width={80} height={16} />
          <SkeletonLoader variant="custom" className={styles.inputSkeleton} />
        </div>
        <div className={styles.dateRow}>
          <div className={styles.field}>
            <SkeletonLoader variant="text" width={80} height={16} />
            <SkeletonLoader variant="custom" className={styles.inputSkeleton} />
          </div>
          <div className={styles.field}>
            <SkeletonLoader variant="text" width={80} height={16} />
            <SkeletonLoader variant="custom" className={styles.inputSkeleton} />
          </div>
        </div>
      </div>

      {/* Questions section skeleton (for Planned) – optional but keep visible for consistency */}
      <div className={styles.section}>
        <SkeletonLoader variant="text" width={180} height={20} />
        <SkeletonLoader variant="custom" className={styles.searchSkeleton} />
        <SkeletonLoader variant="text" width={150} height={16} />
        <div className={styles.questionListSkeleton}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.questionItemSkeleton} />
          ))}
        </div>
      </div>

      {/* Timeframe section skeleton */}
      <div className={styles.section}>
        <SkeletonLoader variant="text" width={160} height={20} />
        <div className={styles.radioSkeleton}>
          <SkeletonLoader variant="custom" className={styles.radioOption} />
          <SkeletonLoader variant="custom" className={styles.radioOption} />
        </div>
        <SkeletonLoader variant="custom" className={styles.selectSkeleton} />
      </div>
    </div>
  );
}