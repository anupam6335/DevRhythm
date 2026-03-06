import React, { useMemo } from 'react';
import clsx from 'clsx';
import type { HeatmapData, HeatmapDailyData } from '@/shared/types';
import HeatmapCell from '@/shared/components/HeatmapCell';
import styles from './Heatmap.module.css';

export interface HeatmapProps {
  /** The heatmap data returned from the backend (including cachedRenderData) */
  data: HeatmapData;
  /** Optional click handler for individual cells */
  onCellClick?: (date: Date) => void;
  /** If true, appends a preview of January next year (zero activity) to fill the right side */
  showNextYearPreview?: boolean;
  /** Additional CSS class for the root container */
  className?: string;
}

/**
 * A yearly coding activity heatmap similar to LeetCode.
 * Uses cachedRenderData from the backend for month labels and tooltips.
 */
const Heatmap: React.FC<HeatmapProps> = ({
  data,
  onCellClick,
  showNextYearPreview = false,
  className,
}) => {
  const { cachedRenderData } = data;

  // Build lookup map from date string to daily data
  const dailyMap = useMemo(() => {
    const map = new Map<string, HeatmapDailyData>();
    data.dailyData.forEach(day => {
      const dateKey = day.date.split('T')[0];
      map.set(dateKey, day);
    });
    return map;
  }, [data.dailyData]);

  // Build lookup map from date string to cached tooltip data
  const tooltipMap = useMemo(() => {
    const map = new Map<string, { summary: string; details: string }>();
    if (cachedRenderData?.tooltipData) {
      cachedRenderData.tooltipData.forEach(item => {
        const dateKey = item.date.split('T')[0];
        map.set(dateKey, { summary: item.summary, details: item.details });
      });
    }
    return map;
  }, [cachedRenderData]);

  // Generate month information using UTC dates
  const months = useMemo(() => {
    const year = data.year;
    const monthsArray = [];

    // Regular months of the current year
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      const daysInMonth: Date[] = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setUTCDate(d.getUTCDate() + 1)) {
        daysInMonth.push(new Date(d));
      }
      const firstDayOfWeek = firstDay.getUTCDay(); // 0 = Sunday
      const totalDays = daysInMonth.length;
      const weeksCount = Math.ceil((firstDayOfWeek + totalDays) / 7);

      // Use cached month label if available, otherwise compute a fallback
      const monthName = cachedRenderData?.monthLabels?.[month] ??
                        firstDay.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

      monthsArray.push({
        monthNumber: month,
        monthName,
        daysInMonth,
        firstDayOfWeek,
        weeksCount,
        isPreview: false,
      });
    }

    // Optional preview of January next year
    if (showNextYearPreview) {
      const nextYear = year + 1;
      const month = 0; // January
      const firstDay = new Date(Date.UTC(nextYear, month, 1));
      const lastDay = new Date(Date.UTC(nextYear, month + 1, 0));
      const daysInMonth: Date[] = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setUTCDate(d.getUTCDate() + 1)) {
        daysInMonth.push(new Date(d));
      }
      const firstDayOfWeek = firstDay.getUTCDay();
      const totalDays = daysInMonth.length;
      const weeksCount = Math.ceil((firstDayOfWeek + totalDays) / 7);

      // Use "Jan" from cached labels, or compute
      const monthName = cachedRenderData?.monthLabels?.[0] ??
                        firstDay.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

      monthsArray.push({
        monthNumber: 12, // special marker
        monthName,
        daysInMonth,
        firstDayOfWeek,
        weeksCount,
        isPreview: true,
      });
    }

    return monthsArray;
  }, [data.year, cachedRenderData, showNextYearPreview]);

  if (!data.dailyData || data.dailyData.length === 0) {
    return null;
  }

  return (
    <div className={clsx(styles.heatmap, className)}>
      <div className={styles.monthsRow}>
        {months.map(month => {
          const firstDayOfWeek = month.firstDayOfWeek;
          const weeksCount = month.weeksCount;

          return (
            <div key={month.monthNumber} className={styles.monthContainer}>
              <div className={styles.monthLabel}>{month.monthName}</div>
              <div
                className={clsx(styles.monthGrid, month.isPreview && styles.previewMonth)}
                style={{
                  gridTemplateColumns: `repeat(${weeksCount}, var(--cell-size))`,
                }}
              >
                {month.daysInMonth.map(day => {
                  const year = day.getUTCFullYear();
                  const monthNum = String(day.getUTCMonth() + 1).padStart(2, '0');
                  const dayNum = String(day.getUTCDate()).padStart(2, '0');
                  const dateStr = `${year}-${monthNum}-${dayNum}`;

                  const dayData = dailyMap.get(dateStr);
                  const count = dayData?.totalActivities ?? 0;
                  const intensity = (dayData?.intensityLevel ?? 0) as 0 | 1 | 2 | 3 | 4;

                  // Get pre‑formatted tooltip content if available
                  const tooltipContent = tooltipMap.get(dateStr)?.summary;

                  const dayOfWeek = day.getUTCDay(); // 0 = Sunday
                  const dayOfMonth = day.getUTCDate();
                  const weekNumber = Math.floor((dayOfMonth - 1 + firstDayOfWeek) / 7);
                  const col = Math.min(weekNumber, weeksCount - 1);

                  return (
                    <div
                      key={dateStr}
                      style={{
                        gridRow: dayOfWeek + 1,
                        gridColumn: col + 1,
                      }}
                    >
                      <HeatmapCell
                        date={day}
                        count={count}
                        intensity={intensity}
                        tooltipContent={tooltipContent}
                        onClick={onCellClick ? () => onCellClick(day) : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Heatmap;