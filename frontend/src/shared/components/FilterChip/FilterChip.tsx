import React from 'react';
import clsx from 'clsx';
import { FaCheck } from 'react-icons/fa';
import styles from './FilterChip.module.css';

export interface FilterChipProps {
  /** Chip label */
  label: string;
  /** Whether the chip is selected */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional count to display (e.g., number of items) */
  count?: number;
  /** Disable the chip */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * A theme‑aware filter chip that toggles on click.
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected = false,
  onClick,
  count,
  disabled = false,
  className,
}) => {
  return (
    <button
      type="button"
      className={clsx(
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
    >
      {selected && <FaCheck className={styles.checkIcon} aria-hidden="true" />}
      <span>{label}</span>
      {count !== undefined && (
        <span className={styles.count} aria-label={`${count} items`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default FilterChip;