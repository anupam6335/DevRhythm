'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Card from '@/shared/components/Card';
import styles from './ProgressChart.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgressChartProps {
  solvedCount: number;
  revisionCompletedCount: number;
  totalQuestions: number;
}

export default function ProgressChart({
  solvedCount,
  revisionCompletedCount,
  totalQuestions,
}: ProgressChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const totalPossible = totalQuestions * 2;
  const completed = solvedCount + revisionCompletedCount;
  const remaining = totalPossible - completed;
  const percentage = totalPossible > 0 ? (completed / totalPossible) * 100 : 0;

  const chartData = useMemo(() => ({
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [completed, remaining],
        backgroundColor: isDark ? ['#7C8B7A', '#3A3B36'] : ['#6C7A6E', '#DAD8D2'],
        borderWidth: 0,
        hoverOffset: 4,
        cutout: '65%',
      },
    ],
  }), [completed, remaining, isDark]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#E6E5DF' : '#242424',
          font: { size: 12 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const total = completed + remaining;
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} (${percent}%)`;
          },
        },
      },
    },
  }), [isDark, completed, remaining]);

  return (
    <Card className={styles.container} noHover>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Overall Progress</h3>
      </div>
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{solvedCount} / {totalQuestions}</span>
          <span className={styles.statLabel}>Solved</span>
        </div>
        <div className={styles.statDivider}>+</div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{revisionCompletedCount} / {totalQuestions}</span>
          <span className={styles.statLabel}>Revision Completed</span>
        </div>
        <div className={styles.statDivider}>=</div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{completed} / {totalPossible}</span>
          <span className={styles.statLabel}>Combined</span>
          <span className={styles.statPercentage}>({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
}