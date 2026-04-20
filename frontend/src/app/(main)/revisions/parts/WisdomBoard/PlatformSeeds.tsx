import PlatformIcon from '@/shared/components/PlatformIcon';
import Card from '@/shared/components/Card';
import Badge from '@/shared/components/Badge';
import styles from './WisdomBoard.module.css';

interface PlatformData {
  platform: string;
  totalRevisions: number;
  completionRate: number;
}

export default function PlatformSeeds({ data }: { data: PlatformData[] }) {
  const items = Array.isArray(data) ? data : [];
  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>Platform</h3>
      <div className={styles.seeds}>
        {items.map(item => (
          <div key={item.platform} className={styles.seed}>
            <PlatformIcon platform={item.platform} size="sm" />
            <span className={styles.platformName}>{item.platform}</span>
            <Badge variant="moss" size="sm">{Math.round(item.completionRate)}%</Badge>
            <span className={styles.stats}>{item.totalRevisions} rev</span>
          </div>
        ))}
      </div>
    </Card>
  );
}