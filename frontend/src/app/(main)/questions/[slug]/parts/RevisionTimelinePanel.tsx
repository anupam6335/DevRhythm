'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiCheck } from 'react-icons/fi';
import { useMarkRevision } from '@/features/revision/hooks/useMarkRevision';
import Button from '@/shared/components/Button';
import Tooltip from '@/shared/components/Tooltip';
import type { RevisionSchedule } from '@/shared/types';
import styles from './RevisionTimelinePanel.module.css';

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

  const scheduleStatuses = optimisticRevision?.scheduleStatuses || [];
  const schedule = optimisticRevision?.schedule || [];
  const currentIndex = optimisticRevision?.currentRevisionIndex ?? 0;

  const handleMarkRevised = useCallback(
    async (targetDate: string) => {
      const targetIndex = schedule.findIndex((d) => d === targetDate);
      if (targetIndex === -1) return;

      const newCompleted = [
        ...(optimisticRevision?.completedRevisions || []),
        {
          date: targetDate,
          completedAt: new Date().toISOString(),
          status: 'completed' as const,
        },
      ];
      const newCurrentIndex = targetIndex === currentIndex ? currentIndex + 1 : currentIndex;
      const newStatus = newCurrentIndex >= schedule.length ? 'completed' : 'active';

      // Update scheduleStatuses: mark target as Completed, and if next index exists, set its status to 'Pending'
      const updatedStatuses = scheduleStatuses.map((item, idx) => {
        if (idx === targetIndex) {
          return { ...item, status: 'Completed' };
        }
        if (idx === newCurrentIndex && newStatus === 'active') {
          return { ...item, status: 'Pending' };
        }
        return item;
      });

      setOptimisticRevision({
        ...optimisticRevision!,
        completedRevisions: newCompleted,
        currentRevisionIndex: newCurrentIndex,
        status: newStatus,
        scheduleStatuses: updatedStatuses,
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
    [schedule, currentIndex, optimisticRevision, revision, markMutation, scheduleStatuses]
  );

  const getAnimationDelay = (idx: number) => `${idx * 0.08}s`;

  if (!optimisticRevision) {
    return (
      <p className={styles.empty}>
        No schedule yet. Solve to generate.
      </p>
    );
  }

  return (
    <div className={styles.timeline}>
      {scheduleStatuses.map((item, idx) => {
        const { status, date } = item;
        const formattedDate = formatUTCDate(date);
        const isCompleted = status === 'Completed';
        const isPending = status === 'Pending';
        const isOverdue = status === 'Overdue';
        const showButton = status === 'Pending';
        const overdue = isOverdue;

        return (
          <div
            key={idx}
            className={styles.timelineItem}
            style={{ animationDelay: getAnimationDelay(idx) }}
          >
            <div
              className={`${styles.marker} ${
                isCompleted ? styles.completed : isPending ? styles.pending : styles.upcoming
              } ${optimisticIndex === idx ? styles.pulse : ''}`}
            >
              {isCompleted && <FiCheck className={styles.checkIcon} />}
            </div>
            <div className={styles.content}>
              <div className={styles.date}>{formattedDate}</div>
              <div className={styles.statusRow}>
                <span
                  className={`${styles.status} ${
                    isCompleted
                      ? styles.statusCompleted
                      : isPending
                      ? styles.statusPending
                      : isOverdue
                      ? styles.statusOverdue
                      : styles.statusUpcoming
                  } ${overdue ? styles.overdue : ''}`}
                >
                  {status}
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