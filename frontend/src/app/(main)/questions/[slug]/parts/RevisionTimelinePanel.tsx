'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck, FiLoader } from 'react-icons/fi';
import { useMarkRevision } from '@/features/revision/hooks/useMarkRevision';
import Button from '@/shared/components/Button';
import Tooltip from '@/shared/components/Tooltip';
import type { RevisionSchedule } from '@/shared/types';
import styles from './RevisionTimelinePanel.module.css';

// Helper to format UTC date as "MMM dd, yyyy"
function formatUTCDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

interface RevisionTimelinePanelProps {
  revision?: RevisionSchedule;
  questionId: string;
}

export const RevisionTimelinePanel: React.FC<RevisionTimelinePanelProps> = ({
  revision,
  questionId,
}) => {
  const [optimisticRevision, setOptimisticRevision] = useState(revision);
  const [optimisticIndex, setOptimisticIndex] = useState<number | null>(null);
  const markMutation = useMarkRevision(questionId);

  useEffect(() => {
    setOptimisticRevision(revision);
    setOptimisticIndex(null);
  }, [revision]);

  if (!optimisticRevision) {
    return <p className={styles.empty}>No revision schedule for this question.</p>;
  }

  const schedule = optimisticRevision.schedule || [];
  const currentIndex = optimisticRevision.currentRevisionIndex || 0;
  const completed = optimisticRevision.completedRevisions || [];

  const getStatus = (idx: number, date: string) => {
    const isCompleted = completed.some((c) => c.date === date);
    if (isCompleted) return 'completed';
    return idx === currentIndex ? 'current' : 'upcoming';
  };

  const isOverdue = (date: string) => {
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const dueDateUTC = new Date(date);
    dueDateUTC.setUTCHours(0, 0, 0, 0);
    return dueDateUTC <= todayUTC;
  };

  const handleMarkRevised = useCallback(
    async (targetDate: string) => {
      const targetIndex = schedule.findIndex((d) => d === targetDate);
      if (targetIndex === -1) return;

      const newCompleted: RevisionSchedule['completedRevisions'] = [
        ...completed,
        {
          date: targetDate,
          completedAt: new Date().toISOString(),
          status: 'completed' as const,
        },
      ];
      const newCurrentIndex = targetIndex === currentIndex ? currentIndex + 1 : currentIndex;
      const newStatus = newCurrentIndex >= schedule.length ? 'completed' : 'active';

      setOptimisticRevision({
        ...optimisticRevision,
        completedRevisions: newCompleted,
        currentRevisionIndex: newCurrentIndex,
        status: newStatus,
      });
      setOptimisticIndex(targetIndex);

      try {
        await markMutation.mutateAsync();
      } catch (error) {
        setOptimisticRevision(revision);
        setOptimisticIndex(null);
        console.error('Failed to mark revision:', error);
      }
    },
    [schedule, completed, currentIndex, optimisticRevision, revision, markMutation]
  );

  const showButtonForIndex = (idx: number, date: string) => {
    if (optimisticIndex !== null) return false;
    if (idx !== currentIndex) return false;
    const isCompleted = completed.some((c) => c.date === date);
    if (isCompleted) return false;
    // Only show button if the revision is due (today or earlier)
    return isOverdue(date);
  };

  const getAnimationDelay = (idx: number) => `${idx * 0.08}s`;

  return (
    <div className={styles.timeline}>
      {schedule.map((date, idx) => {
        const status = getStatus(idx, date);
        const isCurrent = status === 'current';
        const isCompleted = status === 'completed';
        const showButton = showButtonForIndex(idx, date);
        const overdue = isCurrent && isOverdue(date);
        const formattedDate = formatUTCDate(date);

        return (
          <div
            key={idx}
            className={styles.timelineItem}
            style={{ animationDelay: getAnimationDelay(idx) }}
          >
            <div
              className={`${styles.marker} ${isCompleted ? styles.completed : styles.upcoming} ${
                optimisticIndex === idx ? styles.pulse : ''
              }`}
            >
              {isCompleted && <FiCheck className={styles.checkIcon} />}
            </div>
            <div className={styles.content}>
              <div className={styles.date}>{formattedDate}</div>
              <div className={styles.statusRow}>
                <span
                  className={`${styles.status} ${
                    isCompleted ? styles.statusCompleted : isCurrent ? styles.statusCurrent : styles.statusUpcoming
                  } ${overdue ? styles.overdue : ''}`}
                >
                  {isCompleted ? 'Completed' : isCurrent ? (overdue ? 'Overdue' : 'Upcoming') : 'Upcoming'}
                </span>
                {showButton && (
                  <Tooltip content="To mark as revised, spend at least 20 minutes or pass all test cases for this question.">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkRevised(date)}
                      isLoading={markMutation.isPending && optimisticIndex === idx}
                      className={styles.markButton}
                    >
                      Mark as Revised
                    </Button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};