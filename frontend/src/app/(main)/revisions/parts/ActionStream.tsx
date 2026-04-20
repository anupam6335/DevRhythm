'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiCalendar,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiSearch,
  FiX,
  FiStar,
  FiBarChart2,
  FiRefreshCw,
} from 'react-icons/fi';
import { differenceInDays } from 'date-fns';
import { useUpcomingRevisionsList } from '@/features/revision/hooks/useUpcomingRevisionsList';
import { revisionService } from '@/features/revision/services/revisionService';
import Button from '@/shared/components/Button';
import Pagination from '@/shared/components/Pagination';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import NoRecordFound from '@/shared/components/NoRecordFound';
import Tooltip from '@/shared/components/Tooltip';
import PlatformIcon from '@/shared/components/PlatformIcon';
import { formatDateForDisplay } from '@/shared/lib/dateUtils';
import styles from './ActionStream.module.css';

const ITEMS_PER_PAGE = 5;

const safeParseDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const formatDueDate = (dateStr: string) => {
  const date = safeParseDate(dateStr);
  if (!date) return 'Invalid date';
  const daysDiff = differenceInDays(date, new Date());
  if (daysDiff === 0) return 'Today';
  if (daysDiff === 1) return 'Tomorrow';
  if (daysDiff > 0) return `Due in ${daysDiff} days`;
  return `Overdue by ${Math.abs(daysDiff)} days`;
};

const formatOverdueDate = (dateStr: string | undefined) => {
  const date = safeParseDate(dateStr);
  if (!date) return 'Unknown date';
  const daysDiff = differenceInDays(new Date(), date);
  if (daysDiff === 0) return 'Overdue today';
  if (daysDiff === 1) return 'Overdue by 1 day';
  if (daysDiff < 30) return `Overdue by ${daysDiff} days`;
  if (daysDiff < 365) return `Overdue by ${Math.floor(daysDiff / 30)} months`;
  return `Overdue by ${Math.floor(daysDiff / 365)} years`;
};

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

const confidenceGlow = (level: number): React.CSSProperties => {
  const spread = level * 4;
  const size = level * 2;
  const opacity = 0.2 + level * 0.08;
  return {
    '--glow-spread': `${spread}px`,
    '--glow-size': `${size}px`,
    '--glow-opacity': opacity,
  } as React.CSSProperties;
};

type SortOption = 'date-asc' | 'date-desc' | 'difficulty' | 'title';
type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard';

export default function ActionStream() {
  const router = useRouter();
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);

  const [upcomingSearch, setUpcomingSearch] = useState('');
  const [upcomingDifficulty, setUpcomingDifficulty] = useState<DifficultyFilter>('all');
  const [upcomingSort, setUpcomingSort] = useState<SortOption>('date-asc');

  const [overdueSearch, setOverdueSearch] = useState('');
  const [overdueDifficulty, setOverdueDifficulty] = useState<DifficultyFilter>('all');
  const [overdueSort, setOverdueSort] = useState<SortOption>('date-asc');

  useEffect(() => {
    setUpcomingPage(1);
  }, [upcomingSearch, upcomingDifficulty, upcomingSort]);

  useEffect(() => {
    setOverduePage(1);
  }, [overdueSearch, overdueDifficulty, overdueSort]);

  const {
    data: upcomingData,
    isLoading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming,
  } = useUpcomingRevisionsList(upcomingPage, ITEMS_PER_PAGE);

  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [overdueError, setOverdueError] = useState<Error | null>(null);

  const fetchAllOverdue = useCallback(async () => {
    setOverdueLoading(true);
    setOverdueError(null);
    let allItems: any[] = [];
    let page = 1;
    const limit = 20;
    let hasMore = true;
    try {
      while (hasMore) {
        const response = await revisionService.getOverdueRevisionsList({ page, limit });
        const items = response.revisions || [];
        allItems = [...allItems, ...items];
        const total = response.pagination?.total || 0;
        hasMore = allItems.length < total;
        page++;
      }
      setOverdueItems(allItems.filter((item) => item.questionId !== null));
    } catch (err) {
      console.error('Failed to fetch overdue revisions:', err);
      setOverdueError(err as Error);
    } finally {
      setOverdueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOverdue();
  }, [fetchAllOverdue]);

  const allUpcomingItems = useMemo(() => {
    if (!upcomingData?.upcomingRevisions) return [];
    return upcomingData.upcomingRevisions.flatMap((group) =>
      group.questions.map((q) => ({
        id: q._id,
        questionId: q.questionId._id,
        platformQuestionId: q.questionId.platformQuestionId,
        title: q.questionId.title,
        difficulty: q.questionId.difficulty as 'Easy' | 'Medium' | 'Hard',
        platform: q.questionId.platform,
        scheduledDate: group.date,
        revisionIndex: q.revisionIndex,
        totalTimeSpent: 0,
        attemptsCount: 0,
        revisionCount: q.revisionIndex || 0,
        confidenceLevel: 3,
      }))
    );
  }, [upcomingData]);

  const filteredUpcoming = useMemo(() => {
    let items = [...allUpcomingItems];
    if (upcomingSearch.trim()) {
      const lower = upcomingSearch.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(lower));
    }
    if (upcomingDifficulty !== 'all') {
      items = items.filter((item) => item.difficulty === upcomingDifficulty);
    }
    switch (upcomingSort) {
      case 'date-asc':
        items.sort(
          (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        break;
      case 'date-desc':
        items.sort(
          (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
        );
        break;
      case 'difficulty':
        const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
        items.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
        break;
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return items;
  }, [allUpcomingItems, upcomingSearch, upcomingDifficulty, upcomingSort]);

  const totalUpcoming = filteredUpcoming.length;
  const upcomingTotalPages = Math.ceil(totalUpcoming / ITEMS_PER_PAGE);
  useEffect(() => {
    if (upcomingPage > upcomingTotalPages && upcomingTotalPages > 0) {
      setUpcomingPage(upcomingTotalPages);
    } else if (upcomingTotalPages === 0) {
      setUpcomingPage(1);
    }
  }, [upcomingTotalPages, upcomingPage]);

  const paginatedUpcoming = filteredUpcoming.slice(
    (upcomingPage - 1) * ITEMS_PER_PAGE,
    upcomingPage * ITEMS_PER_PAGE
  );

  const allOverdueItems = useMemo(() => {
    return overdueItems.map((item) => {
      const lastCompleted = item.completedRevisions?.slice(-1)[0];
      const confidenceLevel = lastCompleted?.confidenceAfter || 3;
      const totalTimeSpent =
        item.completedRevisions?.reduce((sum: number, cr: any) => sum + (cr.timeSpent || 0), 0) ||
        0;
      const attemptsCount = item.completedRevisions?.length || 0;
      const revisionCount = item.currentRevisionIndex || 0;
      return {
        _id: item._id,
        questionId: item.questionId!._id,
        platformQuestionId: item.questionId!.platformQuestionId,
        title: item.questionId!.title,
        difficulty: item.questionId!.difficulty as 'Easy' | 'Medium' | 'Hard',
        platform: item.questionId!.platform,
        scheduledDate: item.schedule?.[item.currentRevisionIndex],
        totalTimeSpent,
        attemptsCount,
        revisionCount,
        confidenceLevel,
      };
    });
  }, [overdueItems]);

  const filteredOverdue = useMemo(() => {
    let items = [...allOverdueItems];
    if (overdueSearch.trim()) {
      const lower = overdueSearch.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(lower));
    }
    if (overdueDifficulty !== 'all') {
      items = items.filter((item) => item.difficulty === overdueDifficulty);
    }
    switch (overdueSort) {
      case 'date-asc':
        items.sort(
          (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        break;
      case 'date-desc':
        items.sort(
          (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
        );
        break;
      case 'difficulty':
        const diffOrder = { Easy: 1, Medium: 2, Hard: 3 };
        items.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
        break;
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return items;
  }, [allOverdueItems, overdueSearch, overdueDifficulty, overdueSort]);

  const totalOverdue = filteredOverdue.length;
  const overdueTotalPages = Math.ceil(totalOverdue / ITEMS_PER_PAGE);
  useEffect(() => {
    if (overduePage > overdueTotalPages && overdueTotalPages > 0) {
      setOverduePage(overdueTotalPages);
    } else if (overdueTotalPages === 0) {
      setOverduePage(1);
    }
  }, [overdueTotalPages, overduePage]);

  const paginatedOverdue = filteredOverdue.slice(
    (overduePage - 1) * ITEMS_PER_PAGE,
    overduePage * ITEMS_PER_PAGE
  );

  const handlePractice = (platformQuestionId: string) => {
    router.push(`/questions/${platformQuestionId}`);
  };

  const handleRescue = (platformQuestionId: string) => {
    router.push(`/questions/${platformQuestionId}`);
  };

  const isLoading = upcomingLoading || overdueLoading;
  const hasError = upcomingError || overdueError;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.twoColumns}>
          <div className={styles.strongestCard}>
            <SkeletonLoader variant="custom" className={styles.cardSkeleton} />
          </div>
          <div className={styles.weakestCard}>
            <SkeletonLoader variant="custom" className={styles.cardSkeleton} />
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <FiAlertCircle size={32} />
          <p>Unable to load revision schedule. Please try again later.</p>
          <Button
            variant="primary"
            onClick={() => {
              refetchUpcoming();
              fetchAllOverdue();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.twoColumns}>
        {/* Upcoming Column */}
        <div className={styles.strongestCard}>
          <div className={styles.heroBadge}>
            <FiStar className={styles.badgeIcon} /> Upcoming Revisions
          </div>
          <div className={styles.columnFilters}>
            <div className={styles.searchWrapper}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search title..."
                value={upcomingSearch}
                onChange={(e) => setUpcomingSearch(e.target.value)}
                className={styles.searchInput}
              />
              {upcomingSearch && (
                <button onClick={() => setUpcomingSearch('')} className={styles.clearSearch}>
                  <FiX />
                </button>
              )}
            </div>
            <div className={styles.filterGroup}>
              <select
                value={upcomingDifficulty}
                onChange={(e) => setUpcomingDifficulty(e.target.value as DifficultyFilter)}
                className={styles.filterSelect}
              >
                <option value="all">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <select
                value={upcomingSort}
                onChange={(e) => setUpcomingSort(e.target.value as SortOption)}
                className={styles.filterSelect}
              >
                <option value="date-asc">Due (earliest first)</option>
                <option value="date-desc">Due (latest first)</option>
                <option value="difficulty">Difficulty</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => {
                  setUpcomingSearch('');
                  setUpcomingDifficulty('all');
                  setUpcomingSort('date-asc');
                }}
                className={styles.clearFilters}
              >
                Clear
              </button>
            </div>
          </div>
          <div className={styles.statPills}>
            <div className={styles.statPill}>
              <FiCalendar className={styles.statPillIcon} />
              <span className={styles.statPillValue}>{totalUpcoming}</span>
              <span className={styles.statPillLabel}>items</span>
            </div>
            <div className={styles.statPill}>
              <FiClock className={styles.statPillIcon} />
              <span className={styles.statPillValue}>
                {paginatedUpcoming.length > 0
                  ? formatDueDate(paginatedUpcoming[0].scheduledDate)
                  : '-'}
              </span>
              <span className={styles.statPillLabel}>nearest</span>
            </div>
          </div>
          <div className={styles.recentSection}>
            {paginatedUpcoming.length === 0 ? (
              <NoRecordFound
                message="No upcoming revisions match your filters"
                icon={<FiCalendar size={24} />}
              />
            ) : (
              <>
                <div className={styles.timeline}>
                  {paginatedUpcoming.map((item) => {
                    const isDueToday =
                      safeParseDate(item.scheduledDate) &&
                      differenceInDays(new Date(item.scheduledDate), new Date()) === 0;
                    return (
                      <div key={item.id} className={styles.timelineItem}>
                        <div
                          className={styles.node}
                          style={confidenceGlow(item.confidenceLevel || 3)}
                        />
                        <div className={styles.date}>
                          {formatDateForDisplay(new Date(item.scheduledDate))}
                        </div>
                        <div className={styles.titleLine}>
                          <span className={styles.connector}>╰─</span>
                          <Link
                            href={`/questions/${item.platformQuestionId}`}
                            className={styles.titleLink}
                          >
                            {item.title}
                          </Link>
                          <span className={styles.status}>Upcoming</span>
                        </div>
                        <div className={styles.meta}>
                          <span
                            className={`${styles.difficulty} ${styles[`difficulty${item.difficulty}`]}`}
                          >
                            {item.difficulty}
                          </span>
                          <PlatformIcon platform={item.platform} size="sm" />
                          <span className={styles.platform}>{item.platform}</span>
                          <span className={styles.dueDate}>
                            <FiClock size={12} /> {formatDueDate(item.scheduledDate)}
                          </span>
                        </div>
                        <div className={styles.metricsRow}>
                          <Tooltip content={`Total time spent: ${item.totalTimeSpent} minutes`}>
                            <span className={styles.metric}>
                              <FiClock className={styles.metricIcon} />{' '}
                              {item.totalTimeSpent < 60
                                ? `${item.totalTimeSpent}m`
                                : `${Math.round(item.totalTimeSpent / 60)}h`}
                            </span>
                          </Tooltip>
                          <Tooltip content={`Attempts: ${item.attemptsCount}`}>
                            <span className={styles.metric}>
                              <span className={styles.metricIcon}>👣</span> {item.attemptsCount} att
                            </span>
                          </Tooltip>
                          <Tooltip content={`Revisions: ${item.revisionCount}`}>
                            <span className={styles.metric}>
                              <FiRefreshCw className={styles.metricIcon} /> {item.revisionCount} rev
                            </span>
                          </Tooltip>
                        </div>
                        {isDueToday && (
                          <div className={styles.itemActions}>
                            <button
                              className={styles.practiceButton}
                              onClick={() => handlePractice(item.platformQuestionId)}
                            >
                              Practice
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {upcomingTotalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      currentPage={upcomingPage}
                      totalPages={upcomingTotalPages}
                      onPageChange={setUpcomingPage}
                      size="sm"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Overdue Column */}
        <div className={styles.weakestCard}>
          <div className={styles.heroBadge}>
            <FiBarChart2 className={styles.badgeIcon} /> Overdue Revisions
          </div>
          <div className={styles.columnFilters}>
            <div className={styles.searchWrapper}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search title..."
                value={overdueSearch}
                onChange={(e) => setOverdueSearch(e.target.value)}
                className={styles.searchInput}
              />
              {overdueSearch && (
                <button onClick={() => setOverdueSearch('')} className={styles.clearSearch}>
                  <FiX />
                </button>
              )}
            </div>
            <div className={styles.filterGroup}>
              <select
                value={overdueDifficulty}
                onChange={(e) => setOverdueDifficulty(e.target.value as DifficultyFilter)}
                className={styles.filterSelect}
              >
                <option value="all">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <select
                value={overdueSort}
                onChange={(e) => setOverdueSort(e.target.value as SortOption)}
                className={styles.filterSelect}
              >
                <option value="date-asc">Due (earliest first)</option>
                <option value="date-desc">Due (latest first)</option>
                <option value="difficulty">Difficulty</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => {
                  setOverdueSearch('');
                  setOverdueDifficulty('all');
                  setOverdueSort('date-asc');
                }}
                className={styles.clearFilters}
              >
                Clear
              </button>
            </div>
          </div>
          <div className={styles.statPills}>
            <div className={styles.statPill}>
              <FiAlertCircle className={styles.statPillIcon} />
              <span className={styles.statPillValue}>{totalOverdue}</span>
              <span className={styles.statPillLabel}>items</span>
            </div>
            <div className={styles.statPill}>
              <FiClock className={styles.statPillIcon} />
              <span className={styles.statPillValue}>
                {paginatedOverdue.length > 0
                  ? formatOverdueDate(paginatedOverdue[0].scheduledDate)
                  : '-'}
              </span>
              <span className={styles.statPillLabel}>worst overdue</span>
            </div>
          </div>
          <div className={styles.recentSection}>
            {paginatedOverdue.length === 0 ? (
              <NoRecordFound
                message="No overdue revisions match your filters"
                icon={<FiCheck size={24} />}
              />
            ) : (
              <>
                <div className={styles.timeline}>
                  {paginatedOverdue.map((item) => (
                    <div key={item._id} className={styles.timelineItem}>
                      <div
                        className={styles.node}
                        style={confidenceGlow(item.confidenceLevel || 3)}
                      />
                      <div className={styles.date}>
                        {formatDateForDisplay(new Date(item.scheduledDate))}
                      </div>
                      <div className={styles.titleLine}>
                        <span className={styles.connector}>╰─</span>
                        <Link
                          href={`/questions/${item.platformQuestionId}`}
                          className={styles.titleLink}
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className={styles.meta}>
                        <span
                          className={`${styles.difficulty} ${styles[`difficulty${item.difficulty}`]}`}
                        >
                          {item.difficulty}
                        </span>
                        <PlatformIcon platform={item.platform} size="sm" />
                        <span className={styles.platform}>{item.platform}</span>
                        <span className={styles.overdueDate}>
                          <FiAlertCircle size={12} /> {formatOverdueDate(item.scheduledDate)}
                        </span>
                      </div>
                      <div className={styles.metricsRow}>
                        <Tooltip content={`Total time spent: ${item.totalTimeSpent} minutes`}>
                          <span className={styles.metric}>
                            <FiClock className={styles.metricIcon} />{' '}
                            {item.totalTimeSpent < 60
                              ? `${item.totalTimeSpent}m`
                              : `${Math.round(item.totalTimeSpent / 60)}h`}
                          </span>
                        </Tooltip>
                        <Tooltip content={`Attempts: ${item.attemptsCount}`}>
                          <span className={styles.metric}>
                            <span className={styles.metricIcon}>👣</span> {item.attemptsCount} att
                          </span>
                        </Tooltip>
                        <Tooltip content={`Revisions: ${item.revisionCount}`}>
                          <span className={styles.metric}>
                            <FiRefreshCw className={styles.metricIcon} /> {item.revisionCount} rev
                          </span>
                        </Tooltip>
                      </div>
                      <div className={styles.itemActions}>
                        <span className={styles.actionStatus}>Overdue</span>
                        <button
                          className={`${styles.actionButton} ${styles.rescueButton}`}
                          onClick={() => handleRescue(item.platformQuestionId)}
                        >
                          <FiCheck /> Review Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {overdueTotalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      currentPage={overduePage}
                      totalPages={overdueTotalPages}
                      onPageChange={setOverduePage}
                      size="sm"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}