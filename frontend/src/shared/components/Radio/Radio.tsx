import React, { useId } from 'react';
import clsx from 'clsx';
import styles from './Radio.module.css';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioProps {
  /** Name attribute for the radio group */
  name: string;
  /** Array of options to display */
  options: RadioOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Disable the entire group */
  disabled?: boolean;
  /** Orientation of the group: horizontal or vertical */
  orientation?: 'horizontal' | 'vertical';
  /** Additional CSS class */
  className?: string;
}

/**
 * A theme‑aware radio button group.
 * Follows WAI‑ARIA practices and uses the DevRhythm design tokens.
 */
export const Radio: React.FC<RadioProps> = ({
  name,
  options,
  value,
  onChange,
  disabled = false,
  orientation = 'vertical',
  className,
}) => {
  const groupId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={groupId}
      className={clsx(
        styles.radioGroup,
        styles[orientation],
        disabled && styles.disabled,
        className
      )}
    >
      {options.map((option) => {
        const optionId = `radio-${groupId}-${option.value}`;
        return (
          <div key={option.value} className={styles.radioItem}>
            <input
              type="radio"
              id={optionId}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled}
              className={styles.nativeInput}
            />
            <label htmlFor={optionId} className={styles.label}>
              <span className={styles.customRadio} aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default Radio;