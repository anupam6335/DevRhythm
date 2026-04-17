import Link from 'next/link';
import { FiGrid } from 'react-icons/fi';
import Card from '@/shared/components/Card';
import NoRecordFound from '@/shared/components/NoRecordFound';
import { slugify } from '@/shared/lib/stringUtils';
import type { PatternMastery } from '@/shared/types';
import styles from './OtherPatternsList.module.css';

interface OtherPatternsListProps {
  patterns: PatternMastery[];
  currentPatternName: string;
}

export default function OtherPatternsList({ patterns, currentPatternName }: OtherPatternsListProps) {
  if (!patterns.length) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Other Patterns</h3>
          <Link href="/patterns" className={styles.viewAll}>
            View all patterns →
          </Link>
        </div>
        <NoRecordFound
          message="No other patterns available yet. Keep solving to discover more!"
          icon={<FiGrid size={48} />}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Other Patterns</h3>
        <Link href="/patterns" className={styles.viewAll}>
          View all patterns →
        </Link>
      </div>
      <div className={styles.grid}>
        {patterns.map((pattern) => (
          <Link
            key={pattern._id}
            href={`/patterns/${slugify(pattern.patternName)}`}
            className={styles.cardLink}
          >
            <Card className={styles.otherCard}>
              <div className={styles.cardName}>{pattern.patternName}</div>
              <div className={styles.cardMastery}>
                <span className={styles.masteryValue}>{pattern.masteryRate.toFixed(1)}%</span>
                <span className={styles.masteryLabel}>mastery</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}