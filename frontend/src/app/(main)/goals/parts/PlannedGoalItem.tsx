'use client';

import { useState } from 'react';
import Link from 'next/link';
import { differenceInDays, format } from 'date-fns';
import { FiChevronDown, FiChevronRight, FiEdit2, FiTrash2 } from 'react-icons/fi';
import clsx from 'clsx';
import type { Goal } from '@/shared/types';
import Card from '@/shared/components/Card';
import ProgressBar from '@/shared/components/ProgressBar';
import Badge from '@/shared/components/Badge';
import Tooltip from '@/shared/components/Tooltip';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import GoalQuestionItem from './GoalQuestionItem';
import styles from './PlannedGoalItem.module.css';

interface PlannedGoalItemProps {
  goal: Goal;
  onDelete: (goalId: string) => void;
  onEdit?: (goalId: string) => void;
  isDeleting?: boolean;
}

const getDaysLeft = (endDate: string): number | null => {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInDays(end, today);
  return diff >= 0 ? diff : null;
};

const formatEndDate = (endDate: string): string => {
  const date = new Date(endDate);
  const daysLeft = getDaysLeft(endDate);
  if (daysLeft === 0) return 'ends today';
  if (daysLeft === 1) return 'ends tomorrow';
  if (daysLeft !== null) return `ends ${format(date, 'MMM d')}`;
  return `ended ${format(date, 'MMM d')}`;
};

const getGoalTitle = (goal: Goal): string => {
  const targetCount = goal.targetCount;
  const isPlanned = goal.goalType === 'planned';
  if (isPlanned) {
    const questionCount = (goal as any).targetQuestions?.length || targetCount;
    return `Solve ${questionCount} question${questionCount !== 1 ? 's' : ''} by ${format(new Date(goal.endDate), 'MMM d, yyyy')}`;
  }
  return `${goal.goalType === 'daily' ? 'Daily' : 'Weekly'} goal: ${targetCount} problem${targetCount !== 1 ? 's' : ''}`;
};

export default function PlannedGoalItem({ goal, onDelete, onEdit, isDeleting = false }: PlannedGoalItemProps) {
  const [isExpanded, setIsExpanded] = useState(goal.status === 'active');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!goal) return null;

  const percentage = Math.round(goal.completionPercentage ?? 0);
  const isCompleted = goal.status === 'completed';
  const isFailed = goal.status === 'failed';
  const daysLeft = getDaysLeft(goal.endDate);
  const isOverdue = daysLeft === null && !isCompleted && !isFailed;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(goal._id);
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(goal._id);
  };

  const questions = (goal as any).targetQuestions || [];
  const completedQuestionIds = new Set(
    ((goal as any).completedQuestions || []).map((cq: any) => {
      const id = cq.questionId?._id || cq.questionId || cq;
      return id.toString();
    })
  );
  const completedCount = questions.filter((q: any) => completedQuestionIds.has(q._id.toString())).length;

  return (
    <>
      <Card
        className={clsx(styles.card, {
          [styles.completed]: isCompleted,
          [styles.failed]: isFailed,
        })}
        noHover
      >
        {/* Header area – wrapped with Link for navigation */}
        <Link href={`/goals/${goal._id}`} className={styles.headerLink}>
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <button
                className={styles.expandButton}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              </button>
              <div className={styles.titleInfo}>
                <div className={styles.titleRow}>
                  <span className={styles.goalTitle}>{getGoalTitle(goal)}</span>
                  <Badge variant={isCompleted ? 'success' : isFailed ? 'error' : 'moss'} size="sm">
                    {isCompleted ? 'completed' : isFailed ? 'failed' : 'active'}
                  </Badge>
                </div>
                <div className={styles.deadline}>
                  <span>{formatEndDate(goal.endDate)}</span>
                  {!isCompleted && !isFailed && daysLeft !== null && daysLeft <= 3 && (
                    <span className={styles.urgent}>⚠️ {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
                  )}
                  {isOverdue && <span className={styles.overdue}>Overdue</span>}
                </div>
              </div>
            </div>

            <div className={styles.statsSection}>
              <div className={styles.progressWrapper}>
                <ProgressBar value={percentage} max={100} size="sm" showValue={false} rounded />
                <span className={styles.percentage}>{percentage}%</span>
              </div>
              <div className={styles.actions}>
                {onEdit && !isCompleted && (
                  <Tooltip content="Edit goal">
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(e);
                      }}
                      disabled={isDeleting}
                    >
                      <FiEdit2 size={14} />
                    </button>
                  </Tooltip>
                )}
                {!isCompleted && (
                  <Tooltip content="Delete goal">
                    <button
                      className={styles.actionButton}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteClick(e);
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '...' : <FiTrash2 size={14} />}
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* Expandable content – not wrapped with Link */}
        {isExpanded && (
          <div className={styles.expandedContent}>
            {questions.length === 0 ? (
              <div className={styles.noQuestions}>No questions assigned to this goal.</div>
            ) : (
              <div className={styles.questionsList}>
                {questions.map((question: any) => {
                  const completed = completedQuestionIds.has(question._id.toString());
                  const completedData = ((goal as any).completedQuestions || []).find(
                    (cq: any) => {
                      const qid = cq.questionId?._id || cq.questionId || cq;
                      return qid.toString() === question._id.toString();
                    }
                  );
                  return (
                    <GoalQuestionItem
                      key={question._id}
                      questionId={question._id}
                      questionMetadata={{
                        _id: question._id,
                        title: question.title,
                        platformQuestionId: question.platformQuestionId,
                        platform: question.platform,
                        difficulty: question.difficulty,
                        tags: question.tags,
                        pattern: question.pattern,
                      }}
                      completed={completed}
                      completedAt={completedData?.completedAt}
                      showMetrics={true}
                    />
                  );
                })}
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>{completedCount} of {questions.length} questions completed</span>
            </div>
          </div>
        )}
      </Card>

      {/* Delete confirmation modal (unchanged) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete planned goal"
        size="sm"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="error" size="sm" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p>Are you sure you want to delete <strong>{getGoalTitle(goal)}</strong>? This action cannot be undone.</p>
      </Modal>
    </>
  );
}