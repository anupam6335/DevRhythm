import React from 'react';
import clsx from 'clsx';
import Select, { SelectOption } from '@/shared/components/Select';
import styles from './SortDropdown.module.css';

export interface SortDropdownProps {
  /** Array of sort options */
  options: SelectOption[];
  /** Currently selected sort value */
  value?: string;
  /** Callback when sort selection changes */
  onChange?: (value: string) => void;
  /** Label displayed before the dropdown */
  label?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * A dropdown for selecting a sort field, with an optional label.
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  value,
  onChange,
  label = 'Sort by',
  className,
}) => {
  return (
    <div className={clsx(styles.container, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <Select
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Choose"
        className={styles.select}
      />
    </div>
  );
};

export default SortDropdown;