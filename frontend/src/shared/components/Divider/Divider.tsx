import React from 'react';
import clsx from 'clsx';
import styles from './Divider.module.css';

export interface DividerProps {
  /** Orientation of the divider */
  orientation?: 'horizontal' | 'vertical';
  /** Thickness in pixels (default 1) */
  thickness?: number;
  /** Color (CSS variable or raw color) */
  color?: string;
  /** Optional text to display in the middle (horizontal only) */
  text?: string;
  /** Position of text when present */
  textPosition?: 'left' | 'center' | 'right';
  /** Additional CSS class */
  className?: string;
  /** Accessibility label (for vertical decorative dividers) */
  'aria-label'?: string;
}

/**
 * A theme‑aware divider that can be horizontal or vertical.
 * Supports an optional centered label.
 *
 * @example
 * <Divider />
 * <Divider text="OR" textPosition="center" />
 * <Divider orientation="vertical" thickness={2} />
 */
const Divider = ({
  orientation = 'horizontal',
  thickness = 1,
  color,
  text,
  textPosition = 'center',
  className,
  'aria-label': ariaLabel,
}: DividerProps) => {
  const style = {
    ...(color && { '--divider-color': color }),
    ...(thickness && { '--divider-thickness': `${thickness}px` }),
  } as React.CSSProperties;

  if (orientation === 'vertical') {
    return (
      <div
        className={clsx(styles.vertical, className)}
        style={style}
        role="separator"
        aria-orientation="vertical"
        aria-label={ariaLabel}
      />
    );
  }

  if (!text) {
    return (
      <hr
        className={clsx(styles.horizontal, className)}
        style={style}
        role="separator"
        aria-orientation="horizontal"
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div
      className={clsx(styles.withText, styles[`text-${textPosition}`], className)}
      style={style}
      role="separator"
      aria-orientation="horizontal"
      aria-label={ariaLabel || 'Divider with text'}
    >
      <span className={styles.text}>{text}</span>
    </div>
  );
};

export default Divider;