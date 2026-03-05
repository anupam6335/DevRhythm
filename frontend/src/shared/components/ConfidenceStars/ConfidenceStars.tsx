import React from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import clsx from 'clsx';
import styles from './ConfidenceStars.module.css';

export interface ConfidenceStarsProps {
  /**
   * Confidence level from 1 to 5 (required).
   */
  level: number;
  /**
   * Size of each star in pixels (default: 20).
   */
  size?: number;
  /**
   * Whether to show empty stars for the remaining levels (default: true).
   */
  showEmpty?: boolean;
  /**
   * Optional CSS class name for custom styling.
   */
  className?: string;
  /**
   * Optional ARIA label override. If not provided, a default label is generated.
   */
  ariaLabel?: string;
}

/**
 * Displays confidence level as a row of stars.
 * - Filled stars for the confidence level.
 * - Empty stars (optional) for the remaining up to 5.
 */
const ConfidenceStars: React.FC<ConfidenceStarsProps> = ({
  level,
  size = 20,
  showEmpty = true,
  className,
  ariaLabel,
}) => {
  // Clamp level between 1 and 5
  const safeLevel = Math.min(5, Math.max(1, level));

  const filledStars = Array.from({ length: safeLevel }, (_, i) => (
    <FaStar
      key={`filled-${i}`}
      size={size}
      className={styles.starFilled}
      aria-hidden="true"
    />
  ));

  const emptyStars = showEmpty
    ? Array.from({ length: 5 - safeLevel }, (_, i) => (
        <FaRegStar
          key={`empty-${i}`}
          size={size}
          className={styles.starEmpty}
          aria-hidden="true"
        />
      ))
    : null;

  const defaultAriaLabel = `Confidence level ${safeLevel} out of 5 stars`;

  return (
    <span
      className={clsx(styles.container, className)}
      role="img"
      aria-label={ariaLabel || defaultAriaLabel}
    >
      {filledStars}
      {emptyStars}
    </span>
  );
};

export default ConfidenceStars;