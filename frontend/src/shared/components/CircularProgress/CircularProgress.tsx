'use client';

import { useEffect, useRef } from 'react';
import styles from './CircularProgress.module.css';

interface CircularProgressProps {
  /** Progress percentage (0–100) */
  progress: number;
  /** Size in pixels (width and height) */
  size?: number;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Color of the progress stroke (CSS variable or direct color) */
  progressColor?: string;
  /** Color of the background stroke */
  backgroundColor?: string;
  /** Children to display inside the circle (e.g., percentage text) */
  children?: React.ReactNode;
  /** Animate on mount */
  animate?: boolean;
}

export default function CircularProgress({
  progress,
  size = 80,
  strokeWidth = 6,
  progressColor = 'var(--accent-moss)',
  backgroundColor = 'var(--border)',
  children,
  animate = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (animate && circleRef.current) {
      // Trigger reflow to ensure animation runs
      circleRef.current.style.transition = 'none';
      circleRef.current.style.strokeDashoffset = String(circumference);
      // Force reflow
      circleRef.current.getBoundingClientRect();
      circleRef.current.style.transition = 'stroke-dashoffset 0.6s ease-out';
      circleRef.current.style.strokeDashoffset = String(offset);
    }
  }, [offset, circumference, animate]);

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      <svg
        className={styles.svg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          className={styles.background}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          ref={circleRef}
          className={styles.progress}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          style={!animate ? { strokeDashoffset: offset } : undefined}
        />
      </svg>
      <div className={styles.content}>{children}</div>
    </div>
  );
}