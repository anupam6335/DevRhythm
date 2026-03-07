'use client'
import React, { forwardRef, memo, useRef, useCallback, useId } from 'react';
import clsx from 'clsx';
import styles from './ProgressBar.module.css';

export type ProgressBarSize = 'sm' | 'md' | 'lg';
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current progress value */
  value: number;
  /** Maximum value (default 100) */
  max?: number;
  /** Label displayed above or inside the bar */
  label?: string;
  /** Whether to show the numeric value (e.g., "5/10") */
  showValue?: boolean;
  /** Position of the value text relative to the bar */
  valuePosition?: 'top' | 'right' | 'inside';
  /** Visual size of the progress bar */
  size?: ProgressBarSize;
  /** Color variant based on completion percentage or intent */
  variant?: ProgressBarVariant;
  /** Whether the bar is animated (indeterminate) */
  indeterminate?: boolean;
  /** Whether to round the corners */
  rounded?: boolean;
  /** Height override (in pixels) */
  height?: number;
  /** Optional ID for accessibility */
  id?: string;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value,
      max = 100,
      label,
      showValue = true,
      valuePosition = 'top',
      size = 'md',
      variant = 'default',
      indeterminate = false,
      rounded = true,
      height,
      id: externalId,
      className,
      ...rest
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const generatedId = useId();
    const barId = externalId || `progress-${generatedId}`;
    const fillRef = useRef<HTMLDivElement>(null);

    const getVariantClass = () => {
      if (variant !== 'default') return styles[variant];
      // Auto variant based on percentage
      if (percentage >= 90) return styles.success;
      if (percentage >= 60) return styles.warning;
      return styles.default;
    };

    const valueText = `${value}/${max}`;

    const handleMouseEnter = useCallback(() => {
      if (indeterminate || !fillRef.current) return;
      fillRef.current.classList.remove(styles.animateOnHover);
      void fillRef.current.offsetWidth; // force reflow
      fillRef.current.classList.add(styles.animateOnHover);
    }, [indeterminate]);

    const handleMouseLeave = useCallback(() => {
      if (indeterminate || !fillRef.current) return;
      fillRef.current.classList.remove(styles.animateOnHover);
    }, [indeterminate]);

    return (
      <div
        ref={ref}
        className={clsx(
          styles.progressContainer,
          styles[size],
          rounded && styles.rounded,
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...rest}
      >
        {(label || (showValue && valuePosition === 'top')) && (
          <div className={styles.header}>
            {label && <span className={styles.label}>{label}</span>}
            {showValue && valuePosition === 'top' && (
              <span className={styles.valueText}>{valueText}</span>
            )}
          </div>
        )}

        <div
          className={clsx(styles.track, getVariantClass())}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-labelledby={label ? `${barId}-label` : undefined}
          aria-valuetext={valueText}
        >
          <div
            ref={fillRef}
            className={clsx(styles.fill, indeterminate && styles.indeterminate)}
            style={{
              width: indeterminate ? '50%' : `${percentage}%`,
              height: height ? `${height}px` : undefined,
              '--target-width': `${percentage}%`,
            } as React.CSSProperties}
          >
            {showValue && valuePosition === 'inside' && (
              <span className={styles.insideValue}>{valueText}</span>
            )}
          </div>
        </div>

        {showValue && valuePosition === 'right' && (
          <div className={styles.rightValue}>{valueText}</div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export default memo(ProgressBar);