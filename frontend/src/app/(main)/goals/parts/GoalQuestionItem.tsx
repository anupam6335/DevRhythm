'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiClock, FiRefreshCw } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { useQuestionProgress } from '@/features/progress/hooks/useQuestionProgress';
import Tooltip from '@/shared/components/Tooltip';
import PlatformIcon from '@/shared/components/PlatformIcon';
import { formatDateForDisplay } from '@/shared/lib/dateUtils';
import styles from './GoalQuestionItem.module.css';

export interface GoalQuestionItemProps {
  /** Question ID (required) – used to fetch progress data */
  questionId: string;
  /** Question metadata (title, platform, difficulty, tags, pattern) */
  questionMetadata: {
    _id: string;
    title: string;
    platformQuestionId?: string;
    platform: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags?: string[];
    pattern?: string[];
  };
  /** Whether the question is completed (solved) for this goal */
  completed: boolean;
  /** Date when the question was completed for this goal */
  completedAt?: string;
  /** Whether to show the metrics row (time, attempts, revisions) */
  showMetrics?: boolean;
}

// Helper: safely parse a date string
const safeParseDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// Helper: short relative time (e.g., "2d ago")
const formatShortRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;
  const diffInMinutes = diffInSeconds / 60;
  const diffInHours = diffInMinutes / 60;
  const diffInDays = diffInHours / 24;
  const diffInMonths = diffInDays / 30;
  const diffInYears = diffInDays / 365;

  if (diffInSeconds < 60) return 'now';
  if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h`;
  if (diffInDays < 7) return `${Math.floor(diffInDays)}d`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
  if (diffInMonths < 12) return `${Math.floor(diffInMonths)}mo`;
  return `${Math.floor(diffInYears)}y`;
};

// Confidence glow effect (CSS custom properties)
const confidenceGlow = (level: number = 3): React.CSSProperties => {
  const spread = level * 4;
  const size = level * 2;
  const opacity = 0.2 + level * 0.08;
  return {
    '--glow-spread': `${spread}px`,
    '--glow-size': `${size}px`,
    '--glow-opacity': opacity,
  } as React.CSSProperties;
};

export default function GoalQuestionItem({
  questionId,
  questionMetadata,
  completed,
  completedAt,
  showMetrics = true,
}: GoalQuestionItemProps) {
  // Fetch the user's progress for this question
  const { data: progress, isLoading, error } = useQuestionProgress(questionId);

  // Extract metrics from progress (default to 0 if not available)
  const timeSpent = progress?.totalTimeSpent ?? 0;
  const attemptsCount = progress?.attempts?.count ?? 0;
  const revisionCount = progress?.revisionCount ?? 0;
  const confidenceLevel = progress?.confidenceLevel ?? 3;

  const solvedDate = safeParseDate(completedAt);
  const solvedDisplay = solvedDate ? formatDateForDisplay(solvedDate) : null;
  const timeDisplay = timeSpent < 60 ? `${timeSpent}m` : `${Math.round(timeSpent / 60)}h`;
  const revisionShort = solvedDate ? formatShortRelativeTime(solvedDate) : 'N/A';
  const revisionFull = solvedDate
    ? formatDistanceToNow(solvedDate, { addSuffix: true })
    : 'N/A';

  const difficultyClass = styles[questionMetadata.difficulty.toLowerCase()];
  const pattern = questionMetadata.pattern?.[0] || null;
  const tags = questionMetadata.tags?.slice(0, 2) || [];
  const remainingTags = (questionMetadata.tags?.length || 0) - tags.length;

  const href = `/questions/${questionMetadata.platformQuestionId || questionMetadata._id}`;

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.item}>
        <div className={styles.node} />
        <div className={styles.date}>Loading progress...</div>
        <div className={styles.titleLine}>
          <span className={styles.connector}>╰─</span>
          <span className={styles.titleLink}>{questionMetadata.title}</span>
        </div>
      </div>
    );
  }

  // Error state – still show basic info without metrics
  if (error) {
    console.warn(`Failed to load progress for question ${questionId}:`, error);
    // fall through to render without metrics
  }

  return (
    <div className={styles.item}>
      <div className={clsx(styles.node, styles.nodeGlow)} style={confidenceGlow(confidenceLevel)} />
      <div className={styles.date}>
        {completed ? (solvedDisplay ? `Completed ${solvedDisplay}` : 'Completed') : 'Pending'}
      </div>
      <div className={styles.titleLine}>
        <span className={styles.connector}>╰─</span>
        <Link href={href} className={styles.titleLink}>
          {questionMetadata.title}
        </Link>
        {completed && <FiCheckCircle className={styles.completedIcon} />}
      </div>
      <div className={styles.meta}>
        <span className={clsx(styles.difficulty, difficultyClass)}>{questionMetadata.difficulty}</span>
        <PlatformIcon platform={questionMetadata.platform} size="sm" />
        <span className={styles.platform}>{questionMetadata.platform}</span>
        {pattern && <span className={styles.pattern}>· {pattern}</span>}
      </div>
      {tags.length > 0 && (
        <div className={styles.tagsRow}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
          {remainingTags > 0 && (
            <Tooltip content={questionMetadata.tags?.slice(2).join(', ')}>
              <span className={styles.tag}>+{remainingTags}</span>
            </Tooltip>
          )}
        </div>
      )}
      {showMetrics && (
        <div className={styles.metricsRow}>
          <Tooltip content={`Total time spent: ${timeSpent} minutes`}>
            <span className={styles.metric}>
              <FiClock className={styles.metricIcon} /> {timeDisplay}
            </span>
          </Tooltip>
          <Tooltip content={`Attempts: ${attemptsCount}`}>
            <span className={styles.metric}>
              <span className={styles.metricIcon}>👣</span> {attemptsCount} att
            </span>
          </Tooltip>
          <Tooltip content={`Revisions: ${revisionCount}`}>
            <span className={styles.metric}>
              <FiRefreshCw className={styles.metricIcon} /> {revisionCount} rev
            </span>
          </Tooltip>
          {completedAt && (
            <Tooltip content={`Last activity: ${revisionFull}`}>
              <span className={styles.metric}>
                <FiRefreshCw className={styles.metricIcon} /> {revisionShort}
              </span>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}