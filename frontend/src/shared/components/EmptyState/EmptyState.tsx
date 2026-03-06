import React from 'react';
import clsx from 'clsx';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /**
   * Main title / message to display.
   */
  title: string;

  /**
   * Optional description providing more context.
   */
  description?: string;

  /**
   * Optional icon to render above the title.
   * Use any React element, typically from `react-icons`.
   */
  icon?: React.ReactNode;

  /**
   * Optional action element (button, link, etc.).
   */
  action?: React.ReactNode;

  /**
   * Additional CSS class for the container.
   */
  className?: string;
}

/**
 * A polished empty state placeholder used when no data is available.
 *
 * @example
 * <EmptyState
 *   title="No revisions found"
 *   description="You don't have any revisions scheduled for today."
 *   icon={<FaCalendarTimes />}
 *   action={<Button onClick={handleCreate}>Schedule a revision</Button>}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div className={clsx(styles.container, className)}>
      {icon && <div className={styles.iconWrapper}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.actionWrapper}>{action}</div>}
    </div>
  );
};

export default EmptyState;