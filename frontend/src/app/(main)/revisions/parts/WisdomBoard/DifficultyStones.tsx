import React from 'react';
import { FiCircle, FiInfo } from 'react-icons/fi';
import Badge from '@/shared/components/Badge';
import Card from '@/shared/components/Card';
import ProgressBar from '@/shared/components/ProgressBar';
import Tooltip from '@/shared/components/Tooltip';
import styles from './WisdomBoard.module.css';

interface DifficultyData {
  difficulty: string;
  totalRevisions: number;
  completionRate: number;
}

const difficultyIcons: Record<string, React.ReactElement> = {
  Easy: <FiCircle style={{ color: '#2e7d32' }} />,
  Medium: <FiCircle style={{ color: '#ed6c02' }} />,
  Hard: <FiCircle style={{ color: '#d32f2f' }} />,
};

const validDifficulties = new Set(['Easy', 'Medium', 'Hard']);

export default function DifficultyStones({ data }: { data: DifficultyData[] }) {
  const items = Array.isArray(data) ? data.filter(item => validDifficulties.has(item.difficulty)) : [];

  if (items.length === 0) {
    return (
      <Card className={styles.card}>
        <div className={styles.titleWrapper}>
          <h3 className={styles.title}>Difficulty</h3>
        </div>
        <div className={styles.emptyState}>No difficulty data available</div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <div className={styles.titleWrapper}>
        <h3 className={styles.title}>Difficulty</h3>
      </div>
      <div className={styles.stones}>
        {items.map(item => {
          const flooredRate = Math.floor(item.completionRate);
          const isOver100 = flooredRate > 100;
          const cappedRate = Math.min(flooredRate, 100);
          return (
            <div key={item.difficulty} className={styles.stone}>
              <div className={styles.stoneIcon}>{difficultyIcons[item.difficulty]}</div>
              <div className={styles.stoneContent}>
                <div className={styles.stoneHeader}>
                  <Badge variant={item.difficulty.toLowerCase() as any} size="sm">
                    {item.difficulty}
                  </Badge>
                  <Badge variant="moss" size="sm" className={styles.revisionBadge}>
                    {item.totalRevisions} revision
                  </Badge>
                </div>
                <div className={styles.progressWrapper}>
                  <div className={styles.progressLabel}>
                    <span>Completion rate</span>
                    <Tooltip content="Percentage of scheduled revisions completed (can exceed 100% due to extra revisions)">
                      <FiInfo className={styles.infoIcon} />
                    </Tooltip>
                  </div>
                  <ProgressBar
                    value={cappedRate}
                    max={100}
                    size="md"
                    showValue={true}
                    variant={isOver100 ? 'success' : 'default'}
                    rounded
                  />
                  {isOver100 && (
                    <span className={styles.over100Badge}>+{flooredRate - 100}% extra</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}