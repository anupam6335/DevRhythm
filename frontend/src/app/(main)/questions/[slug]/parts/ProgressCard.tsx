'use client';

import React, { useState, useEffect } from 'react';
import { FaChevronUp, FaChevronDown, FaRedo, FaBook, FaCalendarAlt, FaCheck, FaCheckCircle } from 'react-icons/fa';
import ConfidenceStars from '@/shared/components/ConfidenceStars';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import Button from '@/shared/components/Button';
import type { UserQuestionProgress, RevisionSchedule } from '@/shared/types';
import styles from './ProgressCard.module.css';
import Tooltip from '@/shared/components/Tooltip';

interface ProgressCardProps {
  progress?: UserQuestionProgress;
  revision?: RevisionSchedule;
  isLoading: boolean;
  onMarkRevised: () => void;
  isMarking?: boolean;
  onMarkSolved?: () => void;
  isMarkingSolved?: boolean;
}


// Helper to format UTC date as "MMM dd, yyyy"
function formatUTCDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  progress,
  revision,
  isLoading,
  onMarkRevised,
  isMarking = false,
  onMarkSolved,
  isMarkingSolved = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapseTriggered, setAutoCollapseTriggered] = useState(false);

  useEffect(() => {
    if (!autoCollapseTriggered && !isCollapsed && !isLoading) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        setAutoCollapseTriggered(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [autoCollapseTriggered, isCollapsed, isLoading]);

  const timeSpent = progress?.totalTimeSpent || 0;
  const confidence = progress?.confidenceLevel || 1;
  const attempts = progress?.attempts?.count || 0;
  const revisionsDone = progress?.revisionCount || 0;

  const schedule = revision?.schedule || [];
  const completedRevisions = revision?.completedRevisions || [];
  const totalRevisions = schedule.length;
  const completedCount = completedRevisions.length;

  const currentIndex = revision?.currentRevisionIndex ?? 0;
  const nextRevisionDate = schedule[currentIndex] ? new Date(schedule[currentIndex]) : null;

  // Check if the revision is due today or overdue (UTC date comparison)
  const isRevisionDue = (() => {
    if (!nextRevisionDate) return false;
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const dueDateUTC = new Date(nextRevisionDate);
    dueDateUTC.setUTCHours(0, 0, 0, 0);
    return dueDateUTC <= todayUTC;
  })();

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return { value: minutes, unit: 'min' };
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return { value: hours, unit: hours === 1 ? 'hour' : 'hours' };
    }
    return { value: `${hours}.${Math.floor(mins / 6)}`, unit: 'hours' };
  };

  const timeDisplay = formatTime(timeSpent);

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h3>Your Progress & Revision</h3>
          <SkeletonLoader variant="text" width={20} height={20} />
        </div>
        <div className={styles.content}>
          <SkeletonLoader variant="text" width={100} height={24} />
          <SkeletonLoader variant="text" width={150} height={48} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header} onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3>Your Progress & Revision</h3>
        <button className={styles.toggle} aria-label={isCollapsed ? 'Expand' : 'Collapse'}>
          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.content}>
          <div className={styles.leftColumn}>
            {/* Show "Mark as Solved" only when status is Not Started */}
            {(!progress || progress?.status === 'Not Started') && onMarkSolved && (
              <Button
                variant="primary"
                size="md"
                onClick={onMarkSolved}
                isLoading={isMarkingSolved}
                leftIcon={<FaCheckCircle />}
                className={styles.markSolvedButton}
                fullWidth
              >
                Mark as Solved
              </Button>
            )}
            <div className={styles.metricRow}>
              <FaRedo className={styles.icon} />
              <span className={styles.metricValue}>{attempts}</span>
              <span className={styles.metricLabel}>attempts</span>
            </div>
            <div className={styles.metricRow}>
              <FaBook className={styles.icon} />
              <span className={styles.metricValue}>{revisionsDone}</span>
              <span className={styles.metricLabel}>revisions</span>
            </div>
            <div className={styles.metricRow}>
              <ConfidenceStars level={confidence} size={16} />
              <span className={styles.metricLabel}>confidence</span>
            </div>

            <div className={styles.metricRow}>
              <FaCalendarAlt className={styles.icon} />
              {nextRevisionDate ? (
                <>
                  <span className={styles.metricValue}>
                    {formatUTCDate(schedule[currentIndex])}
                  </span>
                  <span className={styles.metricLabel}>
                    next revision
                    {isRevisionDue && <span className={styles.overdue}> (due today)</span>}
                  </span>
                </>
              ) : (
                <span className={styles.metricLabel}>no upcoming revisions</span>
              )}
            </div>

            {totalRevisions > 0 && (
              <div className={styles.progressIndicator}>
                <span className={styles.progressText}>
                  {completedCount} of {totalRevisions} revisions done
                </span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(completedCount / totalRevisions) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {isRevisionDue && (
              <Tooltip content="You need to spend at least 20 minutes or pass all test cases to complete this revision.">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onMarkRevised}
                  leftIcon={<FaCheck />}
                  isLoading={isMarking}
                  className={styles.markButton}
                >
                  Mark as Revised
                </Button>
              </Tooltip>
            )}
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.timeBlock}>
              <div className={styles.timeNumber}>{timeDisplay.value}</div>
              <div className={styles.timeLabel}>{timeDisplay.unit}</div>
              <div className={styles.timeSub}>total time spent</div>
            </div>

            {totalRevisions > 0 && (
              <div className={styles.revisionProgress}>
                <div className={styles.revisionCircles}>
                  {Array.from({ length: totalRevisions }).map((_, i) => (
                    <div
                      key={i}
                      className={`${styles.circle} ${i < completedCount ? styles.circleFilled : styles.circleEmpty}`}
                    />
                  ))}
                </div>
                <span className={styles.revisionLabel}>
                  {completedCount}/{totalRevisions} revisions
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};