'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { FiChevronDown, FiChevronRight, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import clsx from 'clsx';
import { useCompletedFailedGoals } from '@/features/goal';
import type { Goal } from '@/shared/types';
import Card from '@/shared/components/Card';
import Pagination from '@/shared/components/Pagination';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import NoRecordFound from '@/shared/components/NoRecordFound';
import Button from '@/shared/components/Button';
import Badge from '@/shared/components/Badge';
import GoalQuestionItem from './GoalQuestionItem';
import styles from './HistoryList.module.css';

type SortField = 'endDate' | 'completionPercentage' | 'startDate';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'daily' | 'weekly' | 'planned';

interface HistoryListProps {
  itemsPerPage?: number;
}

const getGoalDisplayTitle = (goal: Goal): string => {
  if (goal.goalType === 'planned') {
    const questionCount = (goal as any).targetQuestions?.length || goal.targetCount;
    return `Solve ${questionCount} question${questionCount !== 1 ? 's' : ''}`;
  }
  return `${goal.goalType === 'daily' ? 'Daily' : 'Weekly'} goal`;
};

const getGoalDateRange = (goal: Goal): string => {
  const start = format(new Date(goal.startDate), 'MMM d');
  const end = format(new Date(goal.endDate), 'MMM d, yyyy');
  return `${start} – ${end}`;
};

export default function HistoryList({ itemsPerPage = 10 }: HistoryListProps) {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useCompletedFailedGoals({
    page,
    limit: itemsPerPage,
  });

  const toggleExpand = (goalId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allGoals = data?.goals || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.pages || 1;

  const filteredGoals = allGoals.filter((goal) => {
    if (filterType === 'all') return true;
    return goal.goalType === filterType;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    let aVal: any, bVal: any;
    if (sortField === 'endDate') {
      aVal = new Date(a.endDate).getTime();
      bVal = new Date(b.endDate).getTime();
    } else if (sortField === 'startDate') {
      aVal = new Date(a.startDate).getTime();
      bVal = new Date(b.startDate).getTime();
    } else {
      aVal = a.completionPercentage;
      bVal = b.completionPercentage;
    }
    if (sortOrder === 'asc') return aVal - bVal;
    return bVal - aVal;
  });

  if (isLoading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>History</h2>
          <div className={styles.filterSortPlaceholder} />
        </div>
        <div className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.skeletonItem} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>History</h2>
        </div>
        <div className={styles.errorContainer}>
          <p>Unable to load history.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <FiArrowUp className={styles.sortIconInactive} />;
    return sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>History</h2>
        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <button
              className={clsx(styles.filterChip, { [styles.active]: filterType === 'all' })}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={clsx(styles.filterChip, { [styles.active]: filterType === 'daily' })}
              onClick={() => setFilterType('daily')}
            >
              Daily
            </button>
            <button
              className={clsx(styles.filterChip, { [styles.active]: filterType === 'weekly' })}
              onClick={() => setFilterType('weekly')}
            >
              Weekly
            </button>
            <button
              className={clsx(styles.filterChip, { [styles.active]: filterType === 'planned' })}
              onClick={() => setFilterType('planned')}
            >
              Planned
            </button>
          </div>
          <div className={styles.sortGroup}>
            <button
              className={clsx(styles.sortButton, { [styles.active]: sortField === 'endDate' })}
              onClick={() => handleSort('endDate')}
            >
              Date <SortIcon field="endDate" />
            </button>
            <button
              className={clsx(styles.sortButton, { [styles.active]: sortField === 'completionPercentage' })}
              onClick={() => handleSort('completionPercentage')}
            >
              Completion <SortIcon field="completionPercentage" />
            </button>
          </div>
        </div>
      </div>

      {sortedGoals.length === 0 ? (
        <NoRecordFound message="No completed or failed goals found" />
      ) : (
        <>
          <div className={styles.list}>
            {sortedGoals.map((goal) => {
              const isExpanded = expandedIds.has(goal._id);
              const isPlanned = goal.goalType === 'planned';
              const percentage = Math.round(goal.completionPercentage);
              const status = goal.status;
              const dateRange = getGoalDateRange(goal);
              const title = getGoalDisplayTitle(goal);

              return (
                <Link
                  key={goal._id}
                  href={`/goals/${goal._id}`}
                  className={styles.linkWrapper}
                >
                  <Card className={styles.historyCard} noHover>
                    <div
                      className={clsx(styles.itemHeader, {
                        [styles.clickable]: isPlanned,
                      })}
                      onClick={(e) => {
                        if (isPlanned) {
                          e.stopPropagation();
                          toggleExpand(goal._id, e);
                        }
                      }}
                    >
                      <div className={styles.itemLeft}>
                        {isPlanned && (
                          <span
                            className={styles.expandIcon}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(goal._id, e);
                            }}
                          >
                            {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                          </span>
                        )}
                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitleRow}>
                            <span className={styles.itemTitle}>{title}</span>
                            <Badge
                              variant={status === 'completed' ? 'success' : 'error'}
                              size="sm"
                            >
                              {status}
                            </Badge>
                          </div>
                          <div className={styles.itemMeta}>
                            <span className={styles.dateRange}>{dateRange}</span>
                            <span className={styles.progress}>
                              {goal.completedCount} / {goal.targetCount} ({percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.itemRight}>
                        <span className={styles.percentageBadge}>{percentage}%</span>
                      </div>
                    </div>

                    {isPlanned && isExpanded && (
                      <div
                        className={styles.expandedContent}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={styles.questionsList}>
                          {((goal as any).targetQuestions || []).map((question: any) => {
                            const completed = ((goal as any).completedQuestions || []).some(
                              (cq: any) => {
                                const qid = cq.questionId?._id || cq.questionId || cq;
                                return qid.toString() === question._id.toString();
                              }
                            );
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
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                siblingCount={1}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}