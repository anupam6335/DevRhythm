'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subMonths,
} from 'date-fns';
import Card from '@/shared/components/Card';
import Tabs from '@/shared/components/Tabs';
import Tooltip from '@/shared/components/Tooltip';
import styles from './RhythmCenter.module.css';

type Period = 'daily' | 'weekly' | 'monthly';

interface RhythmCenterProps {
  trends: {
    daily: Array<{ date: string; completed: number; avgConfidence: number; totalTimeSpent: number }>;
  };
}

const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export default function RhythmCenter({ trends }: RhythmCenterProps) {
  const [period, setPeriod] = useState<Period>('daily');

  const normalizedDaily = useMemo(() => {
    return trends.daily.map(day => ({
      date: day.date,
      completed: safeNumber(day.completed),
      avgConfidence: Math.min(5, Math.max(0, safeNumber(day.avgConfidence))),
      totalTimeSpent: safeNumber(day.totalTimeSpent),
    }));
  }, [trends.daily]);

  const aggregatedData = useMemo(() => {
    const dailyMap = new Map(normalizedDaily.map(d => [d.date, d]));

    if (period === 'daily') {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const days: string[] = [];
      for (let d = thirtyDaysAgo; d <= today; d.setDate(d.getDate() + 1)) {
        days.push(format(d, 'yyyy-MM-dd'));
      }
      return days.map(date => {
        const day = dailyMap.get(date);
        return {
          date: format(new Date(date), 'MMM d'),
          completed: day?.completed ?? 0,
          avgConfidence: day?.avgConfidence ?? 0,
          totalTimeSpent: day?.totalTimeSpent ?? 0,
        };
      });
    }

    if (period === 'weekly') {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const weeks = eachWeekOfInterval({ start: subMonths(start, 3), end: start }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        let completed = 0, confidenceSum = 0, timeSum = 0, count = 0;
        for (let d = weekStart; d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          const day = dailyMap.get(dateStr);
          if (day) {
            completed += day.completed;
            confidenceSum += day.avgConfidence;
            timeSum += day.totalTimeSpent;
            count++;
          }
        }
        const avgConfidence = count > 0 ? confidenceSum / count : 0;
        return {
          date: format(weekStart, 'MMM d'),
          completed,
          avgConfidence: isNaN(avgConfidence) ? 0 : Math.min(5, avgConfidence),
          totalTimeSpent: timeSum,
        };
      }).slice(-12);
    }

    // monthly
    const today = new Date();
    const months = eachMonthOfInterval({ start: subMonths(today, 5), end: today });
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      let completed = 0, confidenceSum = 0, timeSum = 0, count = 0;
      for (let d = monthStart; d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const day = dailyMap.get(dateStr);
        if (day) {
          completed += day.completed;
          confidenceSum += day.avgConfidence;
          timeSum += day.totalTimeSpent;
          count++;
        }
      }
      const avgConfidence = count > 0 ? confidenceSum / count : 0;
      return {
        date: format(month, 'MMM yyyy'),
        completed,
        avgConfidence: isNaN(avgConfidence) ? 0 : Math.min(5, avgConfidence),
        totalTimeSpent: timeSum,
      };
    });
  }, [normalizedDaily, period]);

  const heatmapData = useMemo(() => {
    const dailyMap = new Map(normalizedDaily.map(d => [d.date, d]));
    if (period === 'daily') {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      return days.map(day => ({
        date: day, // Keep as Date object
        completed: dailyMap.get(format(day, 'yyyy-MM-dd'))?.completed ?? 0,
        avgConfidence: dailyMap.get(format(day, 'yyyy-MM-dd'))?.avgConfidence ?? 0,
      }));
    }
    if (period === 'weekly') {
      const today = new Date();
      const start = startOfWeek(today, { weekStartsOn: 1 });
      const weeks = eachWeekOfInterval({ start: subMonths(start, 3), end: start }, { weekStartsOn: 1 });
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        let completed = 0, confidenceSum = 0, count = 0;
        for (let d = weekStart; d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const day = dailyMap.get(format(d, 'yyyy-MM-dd'));
          if (day) {
            completed += day.completed;
            confidenceSum += day.avgConfidence;
            count++;
          }
        }
        const avgConfidence = count > 0 ? confidenceSum / count : 0;
        return {
          date: weekStart,
          completed,
          avgConfidence: isNaN(avgConfidence) ? 0 : Math.min(5, avgConfidence),
        };
      }).slice(-12);
    }
    // monthly
    const today = new Date();
    const months = eachMonthOfInterval({ start: subMonths(today, 5), end: today });
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      let completed = 0, confidenceSum = 0, count = 0;
      for (let d = monthStart; d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const day = dailyMap.get(format(d, 'yyyy-MM-dd'));
        if (day) {
          completed += day.completed;
          confidenceSum += day.avgConfidence;
          count++;
        }
      }
      const avgConfidence = count > 0 ? confidenceSum / count : 0;
      return {
        date: month,
        completed,
        avgConfidence: isNaN(avgConfidence) ? 0 : Math.min(5, avgConfidence),
      };
    });
  }, [normalizedDaily, period]);

  const getIntensityColor = (completed: number) => {
    if (completed === 0) return 'var(--heat-0)';
    if (completed <= 2) return 'var(--heat-1)';
    if (completed <= 5) return 'var(--heat-2)';
    if (completed <= 10) return 'var(--heat-3)';
    return 'var(--heat-4)';
  };

  const tabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>The Rhythm of Practice</h3>
        <Tabs tabs={tabs} activeTab={period} onChange={(id) => setPeriod(id as Period)} variant="underline" size="sm" />
      </div>

      <div className={styles.graphsRow}>
        <SmoothLineGraph title="Revisions / day" data={aggregatedData.map(d => d.completed)} labels={aggregatedData.map(d => d.date)} />
        <SmoothLineGraph title="Confidence trend" data={aggregatedData.map(d => d.avgConfidence)} labels={aggregatedData.map(d => d.date)} />
        <SmoothLineGraph title="Time spent (min)" data={aggregatedData.map(d => d.totalTimeSpent)} labels={aggregatedData.map(d => d.date)} />
      </div>

      <div className={styles.heatmapContainer}>
        <div className={styles.heatmapHeader}>
          <span>{period === 'daily' ? format(new Date(), 'MMMM yyyy') : period === 'weekly' ? 'Weekly Activity' : 'Monthly Activity'}</span>
        </div>
        <div className={styles.heatmapGrid}>
          {heatmapData.map((item, idx) => {
            const label = period === 'daily' ? format(item.date, 'd') : period === 'weekly' ? `W${format(item.date, 'w')}` : format(item.date, 'MMM');
            const confidence = Number(item.avgConfidence);
            return (
              <Tooltip key={idx} content={`${label}: ${item.completed} revisions, avg confidence ${confidence.toFixed(1)}`}>
                <div
                  className={styles.heatmapCell}
                  style={{ backgroundColor: getIntensityColor(item.completed) }}
                >
                  <span className={styles.cellLabel}>{label}</span>
                  <span
                    className={styles.confidenceDot}
                    style={{ backgroundColor: confidence >= 4 ? '#2e7d32' : confidence >= 3 ? '#ed6c02' : '#d32f2f' }}
                  />
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// Smooth cubic bezier line graph with colored segments (green = increase, red = decrease)
function SmoothLineGraph({ title, data, labels }: { title: string; data: number[]; labels: string[] }) {
  const width = 300;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const validData = data.map(v => (isNaN(v) ? 0 : v));
  const maxValue = Math.max(...validData, 1);
  const minValue = Math.min(...validData, 0);
  const range = maxValue - minValue;

  const getX = (i: number) => padding.left + (i / (validData.length - 1)) * innerWidth;
  const getY = (value: number) => padding.top + innerHeight - ((value - minValue) / range) * innerHeight;

  // Generate smooth cubic bezier path between two points
  const getSegmentPath = (p0: { x: number; y: number }, p1: { x: number; y: number }) => {
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p1.x - (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    return `M ${p0.x} ${p0.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  };

  // Determine segment color based on value change
  const getSegmentColor = (prevValue: number, currValue: number) => {
    if (currValue > prevValue) return '#2e7d32'; // green
    if (currValue < prevValue) return '#d32f2f'; // red
    return 'var(--accent-moss)'; // neutral
  };

  // Get point color (same as segment leading into it, or neutral for first/last)
  const getPointColor = (idx: number) => {
    if (idx === 0 && validData.length > 1) {
      return getSegmentColor(validData[0], validData[1]);
    }
    if (idx === validData.length - 1 && idx > 0) {
      return getSegmentColor(validData[idx - 1], validData[idx]);
    }
    if (idx > 0 && idx < validData.length - 1) {
      const prevDiff = validData[idx] - validData[idx - 1];
      const nextDiff = validData[idx + 1] - validData[idx];
      if (prevDiff > 0 || nextDiff > 0) return '#2e7d32';
      if (prevDiff < 0 || nextDiff < 0) return '#d32f2f';
    }
    return 'var(--accent-moss)';
  };

  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, idx: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({ x, y, value: validData[idx], label: labels[idx] });
  };
  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className={styles.graphCard}>
      <h4>{title}</h4>
      <div className={styles.svgWrapper}>
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          {/* Colored segments */}
          {validData.length > 1 &&
            validData.slice(0, -1).map((_, i) => {
              const p0 = { x: getX(i), y: getY(validData[i]) };
              const p1 = { x: getX(i + 1), y: getY(validData[i + 1]) };
              const color = getSegmentColor(validData[i], validData[i + 1]);
              const path = getSegmentPath(p0, p1);
              return (
                <path
                  key={`segment-${i}`}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              );
            })}

          {/* Axes */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="var(--border)" strokeWidth="1" />
          <line x1={padding.left} y1={padding.top + innerHeight} x2={padding.left + innerWidth} y2={padding.top + innerHeight} stroke="var(--border)" strokeWidth="1" />

          {/* Data points */}
          {validData.map((value, i) => {
            const cx = getX(i);
            const cy = getY(value);
            const pointColor = getPointColor(i);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="4"
                fill="var(--bg-surface)"
                stroke={pointColor}
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => handleMouseMove(e as any, i)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>

        {tooltip && (
          <div className={styles.graphTooltip} style={{ left: tooltip.x, top: tooltip.y - 40 }}>
            <strong>{tooltip.label}</strong><br />
            {tooltip.value.toFixed(1)}
          </div>
        )}
      </div>
      <div className={styles.xAxis}>
        {labels.map((l, i) => i % Math.ceil(labels.length / 5) === 0 && <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}