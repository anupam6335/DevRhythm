'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { FiChevronDown } from 'react-icons/fi';

import { heatmapService } from '@/features/heatmap/services/heatmapService';
import Heatmap from '@/shared/components/Heatmap';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import Tooltip from '@/shared/components/Tooltip';
import type { User, HeatmapData } from '@/shared/types';

import styles from './HeatmapSection.module.css';

export interface HeatmapSectionProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
  initialData?: HeatmapData | null;
}

// Legend item component with tooltip explaining the activity range
const LegendItem: React.FC<{ color: string; label: string; level: number }> = ({ color, label, level }) => {
  const tooltipContent = useMemo(() => {
    switch (level) {
      case 1:
        return 'Low activity (1–2 problems)';
      case 2:
        return 'Medium activity (3–4 problems)';
      case 3:
        return 'High activity (5–9 problems)';
      case 4:
        return 'Very high activity (10+ problems)';
      default:
        return '';
    }
  }, [level]);

  return (
    <Tooltip content={tooltipContent} placement="top" delay={300}>
      <div className={styles.legendItem}>
        <span className={styles.legendColor} style={{ backgroundColor: color }} />
        <span className={styles.legendLabel}>{label}</span>
      </div>
    </Tooltip>
  );
};

const HeatmapSection: React.FC<HeatmapSectionProps> = ({
  user,
  isOwnProfile = false,
  className,
  initialData,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get account creation year
  const accountYear = useMemo(() => {
    if (!user?.accountCreated) return currentYear - 1;
    return new Date(user.accountCreated).getFullYear();
  }, [user?.accountCreated, currentYear]);

  // Generate year options from account year to currentYear + 1
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = accountYear; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, [accountYear, currentYear]);

  // Fetch heatmap data
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', user._id, 'heatmap', selectedYear, { isOwnProfile }],
    queryFn: () => {
      if (isOwnProfile) {
        // For own profile, use authenticated endpoint (full data)
        return heatmapService.getHeatmapByYear(selectedYear, true);
      } else {
        // For public profile, use public endpoint (simple version)
        return heatmapService.getPublicUserHeatmap(user._id, selectedYear, { simple: true });
      }
    },
    // Use initialData only for current year and public profile
    initialData: !isOwnProfile && selectedYear === currentYear ? initialData ?? undefined : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  // Prepare legend colors from the data (fallback if not available)
  const colorScale = data?.cachedRenderData?.colorScale || [
    '#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39',
  ];

  const legendItems = [
    { level: 1, label: 'low', color: colorScale[1] },
    { level: 2, label: 'medium', color: colorScale[2] },
    { level: 3, label: 'high', color: colorScale[3] },
    { level: 4, label: 'very high', color: colorScale[4] },
  ];

  // Loading state – show a skeleton
  if (isLoading && !data) {
    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.header}>
          <div className={styles.left}>
            <SkeletonLoader variant="text" width={80} height={24} />
            <div className={styles.legend}>
              {[1, 2, 3, 4].map(i => (
                <SkeletonLoader key={i} variant="text" width={50} height={20} />
              ))}
            </div>
          </div>
          <div className={styles.right}>
            <SkeletonLoader variant="text" width={150} height={32} />
          </div>
        </div>
        <SkeletonLoader variant="custom" height={200} />
      </div>
    );
  }

  // Error state – show a friendly message
  if (error) {
    return (
      <div className={clsx(styles.container, className)}>
        <div className={styles.error}>
          <span>🌱</span>
          <p>Could not load the garden for {selectedYear}. The soil might be resting.</p>
          <button
            className={styles.retryButton}
            onClick={() => setSelectedYear(selectedYear)} // triggers refetch
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // No data or empty daily data – show empty state
  if (!data || !data.dailyData || data.dailyData.length === 0) {
    return (
      <div className={clsx(styles.container, styles.empty, className)}>
        <div className={styles.header}>
          <div className={styles.left}>
            <div className={styles.consistency}>
              <span className={styles.consistencyValue}>0%</span>
              <span className={styles.consistencyLabel}>consistency</span>
            </div>
            {/* Optionally show legend skeleton or nothing */}
          </div>
          <div className={styles.right}>
            <span className={styles.title}>Daily Garden</span>
            <div className={styles.yearSelectWrapper}>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className={styles.yearSelect}
                aria-label="Select year"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <FiChevronDown className={styles.selectIcon} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className={styles.emptyHeatmap}>
          <p>No activity data for {selectedYear} yet.</p>
          {isOwnProfile && (
            <p>Start solving problems to grow your garden!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.left}>
          <div className={styles.consistency}>
            <span className={styles.consistencyValue}>
              {data.consistency?.consistencyScore ?? 0}%
            </span>
            <span className={styles.consistencyLabel}>consistency</span>
          </div>
          <div className={styles.legend}>
            {legendItems.map(item => (
              <LegendItem
                key={item.level}
                level={item.level}
                color={item.color}
                label={item.label}
              />
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <span className={styles.title}>Daily Garden</span>
          <div className={styles.yearSelectWrapper}>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className={styles.yearSelect}
              aria-label="Select year"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <FiChevronDown className={styles.selectIcon} aria-hidden="true" />
          </div>
        </div>
      </div>

      <Heatmap data={data} showNextYearPreview={false} />
    </div>
  );
};

export default HeatmapSection;