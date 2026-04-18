'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './DifficultyRing.module.css';

interface DifficultyRingProps {
  solved: number;
  mastered: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  maxSolved: number;
}

const DifficultyRing: React.FC<DifficultyRingProps> = ({
  solved,
  mastered,
  difficulty,
  maxSolved,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const percentage = maxSolved > 0 ? (solved / maxSolved) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - percentage / 100);

  const color = {
    Easy: '#2e7d32',
    Medium: '#ed6c02',
    Hard: '#d32f2f',
  }[difficulty];

  const handleMouseEnter = () => {
    if (reducedMotion) return;
    setIsHovered(true);
    if (ringRef.current) {
      ringRef.current.style.transition = 'none';
      ringRef.current.style.strokeDashoffset = `${circumference}`;
      ringRef.current.getBoundingClientRect();
      // Slower animation: 1 second ease-out
      ringRef.current.style.transition = 'stroke-dashoffset 1s ease-out';
      ringRef.current.style.strokeDashoffset = `${offset}`;
    }
  };

  const handleMouseLeave = () => {
    if (reducedMotion) return;
    setIsHovered(false);
    if (ringRef.current) {
      ringRef.current.style.transition = 'none';
      ringRef.current.style.strokeDashoffset = `${offset}`;
    }
  };

  return (
    <div
      className={styles.ringCard}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`${difficulty}: ${solved} solved, ${mastered} mastered`}
    >
      <div className={styles.svgContainer}>
        <svg viewBox="0 0 100 100" className={styles.svg}>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--border)"
            strokeWidth="6"
          />
          <circle
            ref={ringRef}
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: reducedMotion ? 'none' : undefined }}
          />
        </svg>
        <div className={styles.ringLabel}>
          <span className={styles.percentage}>{Math.round(percentage)}%</span>
        </div>
      </div>
      <div className={styles.difficultyName}>{difficulty}</div>
      <div className={styles.counts}>
        {solved} solved · {mastered} mastered
      </div>
    </div>
  );
};

export default DifficultyRing;