import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';

import { patternMasteryService } from '@/features/patternMastery/services/patternMasteryService';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import NoRecordFound from '@/shared/components/NoRecordFound';
import { ROUTES } from '@/shared/config/routes';
import type { PatternMastery } from '@/shared/types';

import styles from './PatternsList.module.css';

export interface PatternsListProps {
  userId: string;
  isOwnProfile?: boolean;
  limit?: number;
  className?: string;
}

// ===== Mastery Ring with hover animation (0% → current) =====
const MasteryRing: React.FC<{ percentage: number }> = ({ percentage }) => {
  const size = 24; // increased from 20 to 24
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2; // 11
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={styles.ring}
      style={
        {
          '--ring-circumference': circumference,
          '--fill-to': offset,
        } as React.CSSProperties
      }
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle – animated on hover */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent-moss)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={styles.ringProgress}
      />
    </svg>
  );
};

// ===== Difficulty Dot =====
const DifficultyDot: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
  const color = {
    Easy: '#2e7d32',
    Medium: '#ed6c02',
    Hard: '#d32f2f',
  }[difficulty];
  return <span className={styles.difficultyDot} style={{ backgroundColor: color }} title={difficulty} />;
};

// ===== Pattern Card =====
const PatternCard: React.FC<{ pattern: PatternMastery; href: string }> = ({ pattern, href }) => {
  const recent = pattern.recentQuestions?.slice(0, 2) || [];

  return (
    <Link href={href} className={styles.cardLink}>
      <div className={styles.card}>
        {/* Pattern name + mastery ring */}
        <div className={styles.nameRow}>
          <span className={styles.patternName}>{pattern.patternName}</span>
          <MasteryRing percentage={pattern.masteryRate} />
        </div>

        {/* Solved / mastered stats */}
        <div className={styles.stats}>
          <span className={styles.stat}>{pattern.solvedCount} solved</span>
          <span className={styles.statSeparator}>·</span>
          <span className={styles.stat}>{pattern.masteredCount} mastered</span>
        </div>

        {/* Recent questions with connector */}
        <div className={styles.recent}>
          {recent.length > 0 ? (
            recent.map((q, idx) => (
              <div key={idx} className={styles.recentItem}>
                <span className={styles.connector}>╰─</span>
                <DifficultyDot difficulty={q.difficulty} />
                <span className={styles.recentTitle} title={q.title}>
                   {q.title}
                </span>
              </div>
            ))
          ) : (
            <span className={styles.noRecent}>No recent questions</span>
          )}
        </div>
      </div>
    </Link>
  );
};

// ===== Main Component =====
const PatternsList: React.FC<PatternsListProps> = ({
  userId,
  isOwnProfile = false,
  limit = 6,
  className,
}) => {
  const isDesktop = useMediaQuery('(min-width: 940px)');

  const { data, isLoading, error } = useQuery({
    queryKey: ['patterns', userId, { limit }],
    queryFn: () => patternMasteryService.getUserPatternMastery(userId, { limit, page: 1 }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const patterns = data?.patterns ?? [];

  // ----- Loading state -----
  if (isLoading) {
    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Knowledge Seeds</h2>
          <SkeletonLoader variant="text" width={80} height={24} />
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  // ----- Error state -----
  if (error) {
    return (
      <div className={clsx(styles.container, styles.error, className)}>
        <p>Could not load patterns</p>
      </div>
    );
  }

  // ----- Empty state -----
  if (patterns.length === 0) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Knowledge Seeds</h2>
          {isOwnProfile && (
            <Link href={ROUTES.PATTERNS.ROOT} className={styles.viewAll}>
              View All →
            </Link>
          )}
        </div>
        <NoRecordFound
          message={
            isOwnProfile
              ? 'No patterns yet. Start solving to grow your knowledge seeds!'
              : 'This user hasn’t cultivated any patterns yet.'
          }
          icon={<span className={styles.emptyIcon}>🌱</span>}
        />
        {isOwnProfile && (
          <Link href="/questions" className={styles.findPatternsLink}>
            find problems →
          </Link>
        )}
      </div>
    );
  }

  // ----- Take first 4 patterns for display -----
  const displayPatterns = patterns.slice(0, 4);

  const getPatternHref = (patternName: string) =>
    isOwnProfile
      ? ROUTES.PATTERNS.DETAIL(patternName)
      : `/users/${userId}/patterns/${encodeURIComponent(patternName)}`;

  // ----- Desktop layout with alternating 60/40 widths -----
  if (isDesktop && displayPatterns.length === 4) {
    const [first, second, third, fourth] = displayPatterns;

    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.header}>
          <h2 className={styles.title}>Knowledge Seeds</h2>
          <Link
            href={isOwnProfile ? ROUTES.PATTERNS.ROOT : `/users/${userId}/patterns`}
            className={styles.viewAll}
          >
            View All →
          </Link>
        </div>

        <div className={styles.desktopRows}>
          {/* Row 1: 60% left, 40% right */}
          <div className={styles.row}>
            <div className={styles.largeLeft}>
              <PatternCard pattern={first} href={getPatternHref(first.patternName)} />
            </div>
            <div className={styles.smallRight}>
              <PatternCard pattern={second} href={getPatternHref(second.patternName)} />
            </div>
          </div>

          {/* Row 2: 40% left, 60% right */}
          <div className={styles.row}>
            <div className={styles.smallLeft}>
              <PatternCard pattern={third} href={getPatternHref(third.patternName)} />
            </div>
            <div className={styles.largeRight}>
              <PatternCard pattern={fourth} href={getPatternHref(fourth.patternName)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----- Tablet / mobile layout (single column) or fewer than 4 items -----
  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Knowledge Seeds</h2>
        <Link
          href={isOwnProfile ? ROUTES.PATTERNS.ROOT : `/users/${userId}/patterns`}
          className={styles.viewAll}
        >
          View All →
        </Link>
      </div>

      <div className={styles.grid}>
        {displayPatterns.map((pattern) => (
          <PatternCard
            key={pattern._id}
            pattern={pattern}
            href={getPatternHref(pattern.patternName)}
          />
        ))}
      </div>
    </div>
  );
};

export default PatternsList;