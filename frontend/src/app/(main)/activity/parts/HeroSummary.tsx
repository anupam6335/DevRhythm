'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiEye,
  FiStar,
  FiCheckCircle,
  FiRefreshCw,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';
import { useTodayActivity, useDayActivity } from '@/features/activity/hooks/useActivityData';
import Tooltip from '@/shared/components/Tooltip';
import styles from './HeroSummary.module.css';

interface HeroSummaryProps {
  date?: string;
}

export default function HeroSummary({ date }: HeroSummaryProps) {
  const router = useRouter();
  const todayQuery = useTodayActivity();
  const dayQuery = useDayActivity(date || '');
  const { data, isLoading, error } = date ? dayQuery : todayQuery;

  const isDayPage = !!date;

  let prevDate = null;
  let nextDate = null;
  if (isDayPage && data?.date) {
    const currentDate = new Date(data.date);
    prevDate = subDays(currentDate, 1);
    nextDate = addDays(currentDate, 1);
  }

  const handlePrevDay = () => {
    if (prevDate) {
      router.push(`/activity/${format(prevDate, 'yyyy-MM-dd')}`);
    }
  };

  const handleNextDay = () => {
    if (nextDate) {
      router.push(`/activity/${format(nextDate, 'yyyy-MM-dd')}`);
    }
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div className={styles.skeletonDate} />
          <div className={styles.skeletonActions} />
        </div>
        <div className={styles.statsRow}>
          <div className={styles.skeletonStat} />
          <div className={styles.skeletonStat} />
          <div className={styles.skeletonStat} />
        </div>
        <div className={styles.skeletonProgress} />
      </div>
    );
  }

  if (error || !data) {
    const errorMessage = error?.message || 'Unable to load activity data';
    return (
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>{date ? `Activity for ${date}` : "Today's Activity"}</h3>
        </div>
        <div className={styles.errorState}>
          <Tooltip content={errorMessage}>
            <span>Could not load activity{date ? ` for ${date}` : ' today'}</span>
          </Tooltip>
        </div>
      </div>
    );
  }

  const formattedDate = format(new Date(data.date), 'EEEE, MMMM d, yyyy');
  const studyTime = formatStudyTime(data.studyTimeMinutes);

  const isHighProblems = data.problemsSolved >= 5;
  const isHighStudyTime = data.studyTimeMinutes >= 120;

  // Determine if we're viewing today or a past date
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = isDayPage && data.date === todayStr;

  // Insight logic – date‑aware
  let insightIcon = <FiTrendingUp />;
  let insightLabel = 'Keep going!';
  let insightType: 'success' | 'warning' | 'danger' = 'success';

  if (data.problemsSolved >= 5) {
    insightIcon = <FiStar />;
    insightLabel = '🌟 Great progress!';
    insightType = 'success';
  } else if (data.problemsSolved >= 3) {
    insightIcon = <FiTrendingUp />;
    insightLabel = 'Good start!';
    insightType = 'warning';
  } else if (data.problemsSolved === 0 && data.revisionsCompleted === 0) {
    if (isToday) {
      insightIcon = <FiClock />;
      insightLabel = '📝 Start your day with a problem!';
      insightType = 'warning';
    } else {
      insightIcon = <FiClock />;
      insightLabel = 'No activity on this day';
      insightType = 'danger';
    }
  } else {
    // Some activity but not high – show neutral message for past days
    if (!isToday) {
      insightIcon = <FiCheckCircle />;
      insightLabel = `✓ ${data.problemsSolved} problem${data.problemsSolved > 1 ? 's' : ''} solved`;
      insightType = 'success';
    } else {
      insightIcon = <FiTrendingUp />;
      insightLabel = 'Keep going!';
      insightType = 'warning';
    }
  }

  return (
    <div className={styles.container}>
      {/* Header row */}
      <div className={styles.headerRow}>
        <div className={styles.dateGroup}>
          <FiCalendar className={styles.calendarIcon} />
          {isDayPage ? (
            <span className={styles.title}>{formattedDate}</span>
          ) : (
            <Link href={`/activity/${data.date}`} className={styles.titleLink}>
              <span className={styles.title}>{formattedDate}</span>
            </Link>
          )}
        </div>
        <div className={styles.actions}>
          {isDayPage ? (
            <div className={styles.dayNavButtons}>
              <button onClick={handlePrevDay} disabled={!prevDate} className={styles.navButton}>
                <FiArrowLeft size={14} /> Prev
              </button>
              <button onClick={handleNextDay} disabled={!nextDate} className={styles.navButton}>
                Next <FiArrowRight size={14} />
              </button>
            </div>
          ) : (
            <Link href={`/activity/${data.date}`} className={styles.viewDayLink}>
              <FiEye size={14} /> Full Day View <FiArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Stats row (inline with icons and tooltips) */}
      <div className={styles.statsRow}>
        {/* Problems Solved */}
        <span className={styles.stat}>
          <FiCheckCircle className={styles.iconSolved} />
          <strong>{data.problemsSolved}</strong>
          <Tooltip content="Number of problems solved today">
            <span className={styles.statLabel}>solved</span>
          </Tooltip>
          {isHighProblems && (
            <Tooltip content="Great progress! 5+ problems solved today! 🎉">
              <FiStar className={styles.starIcon} />
            </Tooltip>
          )}
        </span>

        <span className={styles.separator}>•</span>

        {/* Revisions Completed */}
        <span className={styles.stat}>
          <FiRefreshCw className={styles.iconRevision} />
          <strong>{data.revisionsCompleted}</strong>
          <Tooltip content="Revisions completed today">
            <span className={styles.statLabel}>revised</span>
          </Tooltip>
        </span>

        <span className={styles.separator}>•</span>

        {/* Study Time */}
        <span className={styles.stat}>
          <FiClock className={styles.iconTime} />
          <strong>{studyTime}</strong>
          <Tooltip content="Total study time spent today">
            <span className={styles.statLabel}>studied</span>
          </Tooltip>
          {isHighStudyTime && (
            <Tooltip content="Amazing focus! 2+ hours of study today! 💪">
              <FiStar className={styles.starIcon} />
            </Tooltip>
          )}
        </span>

        {/* Insight Chip – date‑aware */}
        <span className={`${styles.insightChip} ${styles[insightType]}`}>
          {insightIcon}
          <span>{insightLabel}</span>
        </span>
      </div>
    </div>
  );
}