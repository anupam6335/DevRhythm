'use client';

import { useState } from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import Tooltip from '@/shared/components/Tooltip';
import styles from './RevisionFunnel.module.css';

interface FunnelData {
  index: number;
  stage: string;
  totalQuestions: number;
  completed: number;
}

export default function RevisionFunnel({ data }: { data: FunnelData[] }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  const maxTotal = Math.max(...data.map(d => d.totalQuestions), 1);
  const barScales = data.map(d => d.totalQuestions / maxTotal);

  const handleBarMouseEnter = (idx: number, event: React.MouseEvent<HTMLDivElement>) => {
    setHoveredBar(idx);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ index: idx, x: rect.left + rect.width / 2, y: rect.top - 8 });
  };
  const handleBarMouseLeave = () => {
    setHoveredBar(null);
    setTooltip(null);
  };

  return (
    <div className={styles.funnelContainer}>
      <div className={styles.header}>
        <FiBarChart2 className={styles.icon} />
        <span className={styles.title}>Revision Funnel</span>
      </div>

      <div className={styles.graphArea}>
        <div className={styles.barsContainer}>
          {data.map((item, idx) => {
            const targetScale = barScales[idx];
            const isHovered = hoveredBar === idx;
            // On hover, we animate from 0 → targetScale.
            // In default state, we show targetScale directly (no animation).
            const currentScale = isHovered ? targetScale : targetScale;
            // But we need to trigger the animation only when hover starts.
            // We'll use a CSS class that toggles transition only when hovering.
            return (
              <div
                key={idx}
                className={styles.barWrapper}
                onMouseEnter={(e) => handleBarMouseEnter(idx, e)}
                onMouseLeave={handleBarMouseLeave}
              >
                <div className={styles.barBackground}>
                  <div className={styles.barOutline} />
                  <div
                    className={`${styles.barFill} ${isHovered ? styles.animate : ''}`}
                    style={{
                      transform: `scaleY(${targetScale})`,
                    }}
                  />
                  {isHovered && (
                    <div
                      className={styles.completionFill}
                      style={{ height: `${(item.completed / item.totalQuestions) * 100 || 0}%` }}
                    />
                  )}
                </div>
                <div className={styles.xLabel}>{item.stage}</div>
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className={styles.tooltip}
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
        >
          <strong>{data[tooltip.index].stage}</strong><br />
          Questions: {data[tooltip.index].totalQuestions}<br />
          Completed: {data[tooltip.index].completed}
        </div>
      )}
    </div>
  );
}