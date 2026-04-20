import Link from 'next/link';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiActivity } from 'react-icons/fi';
import Card from '@/shared/components/Card';
import Badge from '@/shared/components/Badge';
import styles from './WisdomBoard.module.css';

interface PatternData {
  patternName: string;
  slug: string;
  totalRevisions: number;
  completed: number;
  completionRate: number;
}

export default function TopPatterns({ data }: { data: PatternData[] }) {
  const items = Array.isArray(data) ? data.slice(0, 4) : [];

  const getTrend = (rate: number) => {
    if (rate >= 70) return { icon: <FiTrendingUp />, class: styles.trendUp, label: 'improving' };
    if (rate <= 50) return { icon: <FiTrendingDown />, class: styles.trendDown, label: 'needs work' };
    return { icon: <FiMinus />, class: styles.trendNeutral, label: 'steady' };
  };

  if (items.length === 0) {
    return (
      <Card className={styles.card}>
        <div className={styles.titleWrapper}>
          <div className={styles.titleLeft}>
            <FiActivity className={styles.titleIcon} />
            <h3 className={styles.title}>Top patterns</h3>
          </div>
          <Link href="/patterns" className={styles.viewAll}>
            View all →
          </Link>
        </div>
        <div className={styles.emptyState}>No pattern data available</div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <div className={styles.titleWrapper}>
        <div className={styles.titleLeft}>
          <FiActivity className={styles.titleIcon} />
          <h3 className={styles.title}>Top patterns</h3>
        </div>
        <Link href="/patterns" className={styles.viewAll}>
          View all →
        </Link>
      </div>
      <div className={styles.scrolls}>
        {items.map((item, idx) => {
          const rate = item.completionRate || 0;
          const trend = getTrend(rate);
          const slug = item.slug || item.patternName.toLowerCase().replace(/\s+/g, '-');
          return (
            <div key={idx} className={styles.scroll}>
              <div className={styles.scrollHeader}>
                <Link href={`/patterns/${slug}`} className={styles.patternName}>
                  {item.patternName}
                </Link>
                <span className={`${styles.trend} ${trend.class}`}>
                  {trend.icon} {Math.round(rate)}%
                </span>
              </div>
              <div className={styles.statsRow}>
                <Badge variant="moss" size="sm" className={styles.statBadge}>
                  {item.totalRevisions} revision
                </Badge>
                <Badge variant="success" size="sm" className={styles.statBadge}>
                  {item.completed} done
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}