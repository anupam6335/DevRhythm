"use client";

import React from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export type InputVariant = 'outline' | 'filled';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visual style variant */
  variant?: InputVariant;
  /** Size of the input */
  size?: InputSize;
  /** If true, applies error styling and sets aria-invalid */
  error?: boolean;
  /** Icon displayed on the left side of the input */
  leftIcon?: React.ReactNode;
  /** Icon displayed on the right side of the input */
  rightIcon?: React.ReactNode;
  /** Whether the input should take the full width of its container */
  fullWidth?: boolean;
}

/**
 * A reusable input component with support for variants, sizes, icons, and error states.
 * Fully theme‑aware using CSS variables.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'outline',
      size = 'md',
      error = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      readOnly,
      type = 'text',
      ...rest
    },
    ref
  ) => {
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div
        className={clsx(
          styles.wrapper,
          hasLeftIcon && styles.hasLeftIcon,
          hasRightIcon && styles.hasRightIcon,
          fullWidth && styles.fullWidth
        )}
      >
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          ref={ref}
          type={type}
          className={clsx(
            styles.input,
            styles[variant],
            styles[size],
            error && styles.error,
            disabled && styles.disabled,
            readOnly && styles.readOnly,
            className
          )}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error || undefined}
          {...rest}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;