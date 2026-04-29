import styles from './TrendsCharts.module.css';

export function TrendsChartsSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.chartCard}>
        <div className={styles.skeletonChart} />
      </div>
      <div className={styles.chartCard}>
        <div className={styles.skeletonChart} />
      </div>
    </div>
  );
}