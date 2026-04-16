'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiGrid,
  FiCheckCircle,
  FiStar,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiBookOpen,
  FiZap,
  FiAward,
} from 'react-icons/fi';
import { useMediaQuery } from '@/shared/hooks';
import {
  usePatternStats,
  useStrongestPatterns,
  useWeakestPatterns,
  usePatternMastery,
} from '@/features/patternMastery';
import ConfidenceStars from '@/shared/components/ConfidenceStars';
import Pagination from '@/shared/components/Pagination';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import NoRecordFound from '@/shared/components/NoRecordFound';
import { slugify } from '@/shared/lib/stringUtils';
import type { PatternMastery } from '@/shared/types';
import styles from './PatternsDashboardClient.module.css';
import Tooltip from '@/shared/components/Tooltip';

const ITEMS_PER_PAGE = 10;

// Helper for trend indicator
const TrendIndicator: React.FC<{ improvementRate: number }> = ({ improvementRate }) => {
  const formattedRate = Math.abs(improvementRate).toFixed(1);
  if (improvementRate > 0) {
    return (
      <span className={styles.trendUp}>
        <FiTrendingUp /> +{formattedRate}%
      </span>
    );
  }
  if (improvementRate < 0) {
    return (
      <span className={styles.trendDown}>
        <FiTrendingDown /> {formattedRate}%
      </span>
    );
  }
  return (
    <span className={styles.trendNeutral}>
      <FiMinus /> 0%
    </span>
  );
};

// Helper to format percentage to one decimal place
const formatPercentage = (value: number): string => {
  if (value === undefined || value === null) return '0';
  return value.toFixed(1);
};

// Helper to pluralize "question"
const formatSolvedText = (count: number): string => {
  return `${count} question${count !== 1 ? 's' : ''} solved`;
};

// Stat card component with rotation hover
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  rotation: string;
}> = ({ icon, value, label, rotation }) => (
  <div className={styles.statCard} style={{ transform: `rotate(${rotation})` }}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statValue}>{value.toLocaleString()}</div>
    <div className={styles.statLabel}>{label}</div>
  </div>
);

// Difficulty Dot component
const DifficultyDot: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
  const color = {
    Easy: '#2e7d32',
    Medium: '#ed6c02',
    Hard: '#d32f2f',
  }[difficulty];
  return <span className={styles.difficultyDot} style={{ backgroundColor: color }} title={difficulty} />;
};

// Hero card for strongest pattern
const StrongestCard: React.FC<{ pattern: PatternMastery }> = ({ pattern }) => {
  const recent = pattern.recentQuestions?.slice(0, 3) || [];
  const patternSlug = slugify(pattern.patternName);
  return (
    <div className={styles.strongestCard}>
      <div className={styles.heroBadge}>
        <FiStar className={styles.badgeIcon} /> strongest pattern
      </div>
      <Link href={`/patterns/${patternSlug}`} className={styles.heroTitleLink}>
        <h2 className={styles.heroTitle}>{pattern.patternName}</h2>
      </Link>
      <div className={styles.statPills}>
        <div className={styles.statPill}>
          <FiZap className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{formatPercentage(pattern.masteryRate)}%</span>
          <span className={styles.statPillLabel}>mastery</span>
        </div>
        <div className={styles.statPill}>
          <FiStar className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{pattern.confidenceLevel}/5</span>
          <span className={styles.statPillLabel}>confidence</span>
        </div>
        <div className={styles.statPill}>
          <FiBookOpen className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{pattern.solvedCount}</span>
          <span className={styles.statPillLabel}>solved</span>
        </div>
        <div className={styles.statPill}>
          <FiAward className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{pattern.masteredCount}</span>
          <span className={styles.statPillLabel}>mastered</span>
        </div>
      </div>
      {recent.length > 0 && (
        <div className={styles.recentSection}>
          <div className={styles.recentTitle}>
            <FiBookOpen className={styles.recentIcon} /> recent solved
          </div>
          <div className={styles.recentList}>
            {recent.map((q, idx) => (
              <div key={idx} className={styles.recentItem}>
                <span className={styles.recentConnector}>╰─</span>
                <DifficultyDot difficulty={q.difficulty} />
                <Link href={`/questions/${q.platformQuestionId}`} className={styles.recentLink}>
                  {q.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Hero card for weakest pattern
const WeakestCard: React.FC<{ pattern: PatternMastery }> = ({ pattern }) => {
  const recent = pattern.recentQuestions?.slice(0, 2) || [];
  const patternSlug = slugify(pattern.patternName);
  return (
    <div className={styles.weakestCard}>
      <div className={styles.heroBadge}>
        <FiBarChart2 className={styles.badgeIcon} /> weakest pattern
      </div>
      <Link href={`/patterns/${patternSlug}`} className={styles.heroTitleLink}>
        <h3 className={styles.weakestTitle}>{pattern.patternName}</h3>
      </Link>
      <div className={styles.statPills}>
        <div className={styles.statPill}>
          <FiBookOpen className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{pattern.solvedCount}</span>
          <span className={styles.statPillLabel}>solved</span>
        </div>
        <div className={styles.statPill}>
          <FiAward className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{pattern.masteredCount}</span>
          <span className={styles.statPillLabel}>mastered</span>
        </div>
        <div className={styles.statPill}>
          <FiStar className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{pattern.confidenceLevel}/5</span>
          <span className={styles.statPillLabel}>confidence</span>
        </div>
      </div>
      {recent.length > 0 && (
        <div className={styles.recentSection}>
          <div className={styles.recentTitle}>
            <FiBookOpen className={styles.recentIcon} /> recent solved
          </div>
          <div className={styles.recentList}>
            {recent.map((q, idx) => (
              <div key={idx} className={styles.recentItem}>
                <span className={styles.recentConnector}>╰─</span>
                <DifficultyDot difficulty={q.difficulty} />
                <Link href={`/questions/${q.platformQuestionId}`} className={styles.recentLink}>
                  {q.title}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Single row in the pattern list
const PatternRow: React.FC<{ pattern: PatternMastery }> = ({ pattern }) => {
  const patternSlug = slugify(pattern.patternName);
  return (
    <div className={styles.patternRow}>
      <div className={styles.patternInfo}>
        <Link href={`/patterns/${patternSlug}`} className={styles.patternName}>
          {pattern.patternName}
        </Link>
        <div className={styles.patternMeta}>
          <span>{formatSolvedText(pattern.solvedCount)}</span>
          <span className={styles.metaSeparator}>·</span>
          <span>{pattern.masteredCount} mastered</span>
          <span className={styles.metaSeparator}>·</span>
          <span>mastery {formatPercentage(pattern.masteryRate)}%</span>
          <span className={styles.metaSeparator}>·</span>
          <ConfidenceStars level={pattern.confidenceLevel} size={14} />
        </div>
      </div>
      <div className={styles.patternTrend}>
        <Tooltip content="Improvement rate over the last 30 days">
          <TrendIndicator improvementRate={pattern.trend?.improvementRate || 0} />
        </Tooltip>
      </div>
    </div>
  );
};

interface PatternsDashboardClientProps {
  initialData?: {
    stats: any;
    strongest: PatternMastery[];
    weakest: PatternMastery[];
    patterns: any;
  } | null;
}

export default function PatternsDashboardClient({ initialData }: PatternsDashboardClientProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 940px)');
  const [currentPage, setCurrentPage] = useState(1);
  const listHeaderRef = useRef<HTMLDivElement>(null);

  const { data: statsData, isLoading: statsLoading } = usePatternStats();
  const { data: strongestData, isLoading: strongestLoading } = useStrongestPatterns(1);
  const { data: weakestData, isLoading: weakestLoading } = useWeakestPatterns(1);
  const {
    data: patternsData,
    isLoading: patternsLoading,
    error: patternsError,
  } = usePatternMastery({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sortBy: 'masteryRate',
    sortOrder: 'desc',
  });

  const stats = statsData ?? initialData?.stats;
  const strongest = strongestData?.[0] ?? initialData?.strongest?.[0];
  const weakest = weakestData?.[0] ?? initialData?.weakest?.[0];
  const patterns = patternsData?.patterns ?? initialData?.patterns?.patterns ?? [];

  const totalPatternsCount = stats?.totalPatterns ?? patternsData?.pagination?.total ?? 0;
  const totalPages = Math.ceil(totalPatternsCount / ITEMS_PER_PAGE);
  const totalSolvedCount = stats?.totalSolved ?? 0;
  const totalMasteredCount = stats?.totalMastered ?? 0;
  const avgConfidence = stats?.averageConfidence ?? 0;

  const isLoading =
    statsLoading &&
    !stats &&
    strongestLoading &&
    !strongest &&
    weakestLoading &&
    !weakest &&
    patternsLoading &&
    !patternsData;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setTimeout(() => {
      const headerElement = listHeaderRef.current;
      if (headerElement) {
        const yOffset = -80;
        const y = headerElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.statCardSkeleton} />
          ))}
        </div>
        <div className={styles.heroArea}>
          <SkeletonLoader variant="custom" className={styles.strongestCardSkeleton} />
          <SkeletonLoader variant="custom" className={styles.weakestCardSkeleton} />
        </div>
        <div className={styles.listHeader}>
          <SkeletonLoader variant="text" width={200} height={24} />
        </div>
        <div className={styles.patternList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.patternRowSkeleton} />
          ))}
        </div>
      </div>
    );
  }

  if (patternsError) {
    return (
      <div className={styles.container}>
        <NoRecordFound
          message="Could not load pattern mastery data. Please try again later."
          icon={<FiBarChart2 />}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <StatCard icon={<FiGrid />} value={totalPatternsCount} label="patterns" rotation="-0.5deg" />
        <StatCard icon={<FiCheckCircle />} value={totalSolvedCount} label="solved" rotation="0.5deg" />
        <StatCard icon={<FiStar />} value={totalMasteredCount} label="mastered" rotation="-0.3deg" />
        <StatCard icon={<FiBarChart2 />} value={parseFloat(avgConfidence.toFixed(1))} label="avg confidence" rotation="0.3deg" />
      </div>

      {/* Hero area */}
      <div className={styles.heroArea}>
        {strongest ? (
          <StrongestCard pattern={strongest} />
        ) : (
          <div className={styles.strongestCardPlaceholder}>
            <div className={styles.heroBadge}>
              <FiStar className={styles.badgeIcon} /> strongest pattern
            </div>
            <p>No patterns yet. Start solving problems to cultivate your first pattern!</p>
          </div>
        )}
        {weakest ? (
          <WeakestCard pattern={weakest} />
        ) : (
          <div className={styles.weakestCardPlaceholder}>
            <div className={styles.heroBadge}>
              <FiBarChart2 className={styles.badgeIcon} /> weakest pattern
            </div>
            <p>Solve more problems to discover your weak spots.</p>
          </div>
        )}
      </div>

      {/* All patterns list header with ref for scrolling */}
      <div className={styles.listHeader} ref={listHeaderRef}>
        <h2 className={styles.listTitle}>All Patterns · {totalPatternsCount}</h2>
        <span className={styles.trendHeaderLabel}>Improvement Rate</span>
      </div>

      {patterns.length === 0 ? (
        <NoRecordFound
          message="No patterns found. Start solving problems to build your pattern mastery!"
          icon={<FiGrid />}
        />
      ) : (
        <>
          <div className={styles.patternList}>
            {patterns.map((pattern) => (
              <PatternRow key={pattern._id} pattern={pattern} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                siblingCount={isDesktop ? 2 : 1}
                size={isDesktop ? 'md' : 'sm'}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}