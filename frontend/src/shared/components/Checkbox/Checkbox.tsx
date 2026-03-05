'use client';

import React, { useRef, useEffect, forwardRef, useId, useCallback } from 'react';
import clsx from 'clsx';
import { FaCheck } from 'react-icons/fa';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  /**
   * Whether the checkbox is checked.
   */
  checked?: boolean;
  /**
   * Callback fired when the checked state changes.
   */
  onChange?: (checked: boolean) => void;
  /**
   * If true, the checkbox will be in an indeterminate state.
   */
  indeterminate?: boolean;
  /**
   * Label text or element displayed next to the checkbox.
   */
  label?: React.ReactNode;
  /**
   * If true (or a string), applies error styling. The string can be used as an error message,
   * but the component itself does not display the message – that is the parent’s responsibility.
   */
  error?: boolean | string;
  /**
   * ID of an element that describes the error (used for aria-describedby).
   * Only relevant when error is a truthy string.
   */
  errorMessageId?: string;
  /**
   * Additional CSS class for the container.
   */
  className?: string;
}

/**
 * A reusable, accessible checkbox component that follows the DevRhythm design system.
 * Supports checked, indeterminate, disabled, and error states. Fully keyboard navigable.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked = false,
      onChange,
      indeterminate = false,
      label,
      error = false,
      errorMessageId,
      disabled = false,
      id,
      name,
      className,
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const checkboxId = id || generatedId;

    // Combine refs: support both object and function refs
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    // Handle indeterminate prop
    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        onChange?.(e.target.checked);
      },
      [disabled, onChange]
    );

    const isError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;

    // Determine aria attributes
    const ariaInvalid = isError ? true : undefined;
    const ariaDescribedBy = errorMessage && errorMessageId ? errorMessageId : undefined;

    return (
      <label
        className={clsx(
          styles.checkboxContainer,
          {
            [styles.disabled]: disabled,
            [styles.error]: isError,
          },
          className
        )}
      >
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.checkboxInput}
          ref={setRefs}
          aria-checked={indeterminate ? 'mixed' : checked}
          aria-disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          {...rest}
        />
        <span
          className={clsx(styles.checkboxControl, {
            [styles.checked]: checked && !indeterminate,
            [styles.indeterminate]: indeterminate,
          })}
          aria-hidden="true"
        >
          {checked && !indeterminate && <FaCheck />}
          {indeterminate && <span className={styles.indeterminateDash} />}
        </span>
        {label && <span className={styles.checkboxLabel}>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;