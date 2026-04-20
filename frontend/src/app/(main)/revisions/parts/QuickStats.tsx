import { FiBookOpen, FiClock, FiStar, FiZap, FiAward } from 'react-icons/fi';
import Card from '@/shared/components/Card';
import ConfidenceStars from '@/shared/components/ConfidenceStars';
import styles from './QuickStats.module.css';

interface QuickStatsProps {
  totalCompleted: number;
  pending: number;
  avgConfidence: number;
  totalTimeSpent: number;
  longestStreak: number;
}

export default function QuickStats({
  totalCompleted,
  pending,
  avgConfidence,
  totalTimeSpent,
  longestStreak,
}: QuickStatsProps) {
  // Format total time spent (minutes) to hours and minutes
  const hours = Math.floor(totalTimeSpent / 60);
  const minutes = totalTimeSpent % 60;
  const formattedTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <Card className={styles.container}>
      <h3 className={styles.title}>Quick Stats</h3>
      <div className={styles.grid}>
        <div className={styles.stat}>
          <FiBookOpen className={styles.icon} />
          <div className={styles.content}>
            <span className={styles.value}>{totalCompleted}</span>
            <span className={styles.label}>total completed</span>
          </div>
        </div>
        <div className={styles.stat}>
          <FiClock className={styles.icon} />
          <div className={styles.content}>
            <span className={styles.value}>{pending}</span>
            <span className={styles.label}>pending</span>
          </div>
        </div>
        <div className={styles.stat}>
          <FiStar className={styles.icon} />
          <div className={styles.content}>
            <ConfidenceStars level={Math.round(avgConfidence)} size={18} />
            <span className={styles.label}>avg confidence</span>
          </div>
        </div>
        <div className={styles.stat}>
          <FiZap className={styles.icon} />
          <div className={styles.content}>
            <span className={styles.value}>{formattedTime}</span>
            <span className={styles.label}>total time</span>
          </div>
        </div>
        <div className={`${styles.stat} ${styles.fullWidth}`}>
          <FiAward className={styles.icon} />
          <div className={styles.content}>
            <span className={styles.value}>{longestStreak}</span>
            <span className={styles.label}>longest streak</span>
          </div>
        </div>
      </div>
    </Card>
  );
}