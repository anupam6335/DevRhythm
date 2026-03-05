// src/shared/components/Badge/Badge.tsx

import React, { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'moss'
  | 'sand'
  | 'easy'
  | 'medium'
  | 'hard';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The content of the badge.
   */
  children: ReactNode;
  /**
   * Visual style variant. Maps to theme colors.
   * @default 'default'
   */
  variant?: BadgeVariant;
  /**
   * Size of the badge.
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Optional icon element to display before the text.
   */
  icon?: ReactNode;
  /**
   * Additional CSS class names.
   */
  className?: string;
  /**
   * If true, the badge will have a rounded pill shape.
   * @default false
   */
  pill?: boolean;
}

/**
 * Badge component – displays a small label with theme-aware styling.
 *
 * @example
 * <Badge variant="success" size="sm">Completed</Badge>
 * <Badge variant="easy" icon={<FaLeaf />}>Easy</Badge>
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
  pill = false,
  ...rest
}) => {
  return (
    <span
      className={clsx(
        styles.badge,
        styles[`badge--${variant}`],
        styles[`badge--${size}`],
        pill && styles['badge--pill'],
        className
      )}
      {...rest}
    >
      {icon && <span className={styles.badge__icon}>{icon}</span>}
      <span className={styles.badge__text}>{children}</span>
    </span>
  );
};

export default React.memo(Badge);