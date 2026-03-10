import React, { forwardRef, memo } from 'react';
import clsx from 'clsx';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import styles from './StatCard.module.css';

export type StatCardSize = 'sm' | 'md';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Main label (e.g., "Total Solved") */
  label: string;
  /** The numeric or string value to display */
  value: string | number;
  /** Optional icon element displayed above or beside value */
  icon?: React.ReactNode;
  /** Trend information – if provided, shows an arrow and trend value */
  trend?: {
    value: number;          // e.g., +12 or -5
    direction?: 'up' | 'down' | 'neutral';
    label?: string;         // optional text like "vs last week"
  };
  /** Additional description shown below the value */
  description?: string;
  /** Visual size of the card */
  size?: StatCardSize;
  /** Whether the value is loading (shows skeleton) */
  isLoading?: boolean;
  /** Optional link to make the whole card clickable */
  href?: string;
  /** Click handler for the card (if not using href) */
  onClick?: () => void;
}

/**
 * A theme‑aware card that displays a single statistic with optional trend,
 * icon, and description. Follows the DevRhythm design system.
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      label,
      value,
      icon,
      trend,
      description,
      size = 'md',
      isLoading = false,
      href,
      onClick,
      className,
      ...rest
    },
    ref
  ) => {
    const Container = href ? 'a' : 'div';
    const isClickable = !!(href || onClick);

    const renderContent = () => (
      <>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
        <div className={styles.content}>
          <div className={styles.label}>{label}</div>
          {isLoading ? (
            <div className={clsx(styles.value, styles.skeletonValue)} aria-busy="true" />
          ) : (
            <div className={styles.value}>{value}</div>
          )}
          {trend && !isLoading && (
            <div className={styles.trend}>
              {trend.direction === 'up' && <FaArrowUp className={styles.trendUp} aria-hidden="true" />}
              {trend.direction === 'down' && <FaArrowDown className={styles.trendDown} aria-hidden="true" />}
              <span className={styles.trendValue}>
                {trend.direction === 'up' ? '+' : ''}{trend.value}
              </span>
              {trend.label && <span className={styles.trendLabel}>{trend.label}</span>}
            </div>
          )}
          {description && !isLoading && (
            <div className={styles.description}>{description}</div>
          )}
        </div>
      </>
    );

    return (
      <Container
        ref={ref as any}
        href={href}
        onClick={onClick}
        className={clsx(
          styles.statCard,
          styles[size],
          isClickable && styles.clickable,
          isLoading && styles.loading,
          className
        )}
        {...(href ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...(rest as any)} // Cast rest to any to avoid type conflicts between div and a props
      >
        {renderContent()}
      </Container>
    );
  }
);

StatCard.displayName = 'StatCard';

export default memo(StatCard);