import React, { memo } from 'react';
import clsx from 'clsx';
import Tooltip from '@/shared/components/Tooltip';
import styles from './HeatmapCell.module.css';

export interface HeatmapCellProps {
  /** The date of this cell (as a Date object or ISO string) */
  date: Date | string;
  /** Number of activities (problems solved) on this day */
  count: number;
  /** Intensity level (0–4) that determines the cell colour */
  intensity: 0 | 1 | 2 | 3 | 4;
  /** Optional pre‑formatted tooltip content (if not provided, a default is generated) */
  tooltipContent?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS class for the cell wrapper */
  className?: string;
}

/**
 * A single square cell in the heatmap.
 * The colour intensity reflects the activity count.
 * On hover, a tooltip shows the date and the number of problems solved.
 */
const HeatmapCell: React.FC<HeatmapCellProps> = ({
  date,
  count,
  intensity,
  tooltipContent,
  onClick,
  className,
}) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Format using UTC to match the date shown in the heatmap
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  // Use provided tooltip content, or generate a default one
  const tooltip = tooltipContent || `${count} ${count === 1 ? 'problem' : 'problems'} solved on ${formattedDate}`;

  // Determine tooltip placement to avoid clipping at the top/bottom edges
  const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday, 6 = Saturday
  let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
  if (dayOfWeek === 0) {
    placement = 'bottom'; // top row → show below
  } else if (dayOfWeek === 6) {
    placement = 'top'; // bottom row → show above (though 'top' is already default)
  }

  return (
    <Tooltip
      content={tooltip}
      placement={placement}
      className={clsx(styles.cellWrapper, className)}
    >
      <button
        className={clsx(styles.cell, styles[`level${intensity}`])}
        onClick={onClick}
        aria-label={tooltip}
      />
    </Tooltip>
  );
};

export default memo(HeatmapCell);