'use client';

import { format } from 'date-fns';
import { FiCalendar, FiCopy, FiCheckCircle } from 'react-icons/fi';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import { toast } from '@/shared/components/Toast';
import type { UserProgress } from '@/features/sheets';
import styles from './UserProgressHeader.module.css';

interface UserProgressHeaderProps {
  username: string;
  sheetSlug: string;
  joinedAt: string;
  targetDate: string;
  completedAt: string | null;
  isFullyCompleted: boolean;
  stats: UserProgress['stats'];
  shareLink: string;
}

export default function UserProgressHeader({
  username,
  sheetSlug,
  joinedAt,
  targetDate,
  completedAt,
  isFullyCompleted,
  stats,
  shareLink,
}: UserProgressHeaderProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied to clipboard!');
  };

  const targetDateObj = new Date(targetDate);
  const isOverdue = targetDateObj < new Date();
  const daysLeft = Math.ceil((targetDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className={styles.header} noHover>
      <div className={styles.headerContent}>
        <div className={styles.userInfo}>
          <h1 className={styles.username}>{username}</h1>
          <p className={styles.sheetInfo}>Sheet progress for <strong>{sheetSlug}</strong></p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          leftIcon={<FiCopy />}
          className={styles.copyBtn}
        >
          Copy Link
        </Button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.solvedCount} / {stats.totalQuestions}</span>
          <span className={styles.statLabel}>Solved</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.revisionCompletedCount} / {stats.totalQuestions}</span>
          <span className={styles.statLabel}>Revision Completed</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{stats.completionPercentage.toFixed(1)}%</span>
          <span className={styles.statLabel}>Combined Progress</span>
        </div>
      </div>

      <div className={styles.metadata}>
        <div className={styles.metaRow}>
          <FiCalendar className={styles.metaIcon} />
          <span>Joined: {format(new Date(joinedAt), 'MMM d, yyyy')}</span>
        </div>
        <div className={styles.metaRow}>
          <FiCalendar className={styles.metaIcon} />
          <span>Target: {format(new Date(targetDate), 'MMM d, yyyy')}</span>
          {isOverdue && <Badge variant="error" size="sm">Overdue</Badge>}
          {!isOverdue && daysLeft >= 0 && (
            <Badge variant={daysLeft <= 3 ? 'warning' : 'success'} size="sm">
              {daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
            </Badge>
          )}
        </div>
        {completedAt && (
          <div className={styles.metaRow}>
            <FiCheckCircle className={styles.metaIcon} />
            <span>Completed: {format(new Date(completedAt), 'MMM d, yyyy')}</span>
            <Badge variant="success" size="sm">Fully Completed 🎉</Badge>
          </div>
        )}
        {isFullyCompleted && !completedAt && (
          <div className={styles.metaRow}>
            <FiCheckCircle className={styles.metaIcon} />
            <span>All questions solved and revised!</span>
            <Badge variant="success" size="sm">Completed</Badge>
          </div>
        )}
      </div>
    </Card>
  );
}