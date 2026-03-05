"use client";

import React, { useEffect, useRef, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './TextArea.module.css';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label text displayed above the textarea.
   */
  label?: string;
  /**
   * Helper text displayed below the textarea (e.g., instructions).
   */
  helperText?: string;
  /**
   * Error message (or boolean) – when present, applies error styling and displays the message.
   */
  error?: string | boolean;
  /**
   * If `true`, displays a character counter when `maxLength` is set.
   */
  showCount?: boolean;
  /**
   * If `true`, automatically adjusts the height based on content.
   */
  autoResize?: boolean;
  /**
   * Number of visible text lines (default: 3).
   */
  rows?: number;
}

/**
 * TextArea – A reusable multi‑line text input component with support for labels,
 * helper text, error states, character counting, and auto‑resize.
 *
 * @example
 * <TextArea
 *   label="Notes"
 *   value={notes}
 *   onChange={handleChange}
 *   maxLength={5000}
 *   showCount
 *   autoResize
 * />
 */
const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      helperText,
      error,
      showCount = false,
      autoResize = false,
      rows = 3,
      className,
      id: idProp,
      value,
      onChange,
      maxLength,
      disabled,
      readOnly,
      required,
      ...rest
    },
    forwardedRef
  ) => {
    // Generate a unique ID for accessibility if none is provided
    const generatedId = React.useId();
    const id = idProp || `textarea-${generatedId}`;

    // Refs for auto‑resize
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (forwardedRef ||
      internalRef) as React.RefObject<HTMLTextAreaElement>;

    // Auto‑resize effect
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize, textareaRef]);

    // Determine if we have an error message (string) or just a flag
    const errorMessage = typeof error === 'string' ? error : undefined;
    const hasError = !!error;

    // Helper text or error message IDs for aria‑describedby
    const helperId = helperText ? `${id}-helper` : undefined;
    const errorId = hasError ? `${id}-error` : undefined;
    const describedBy =
      [helperId, errorId, showCount ? `${id}-count` : undefined]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div
        className={clsx(
          styles.container,
          disabled && styles.disabled,
          className
        )}
      >
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}

        <textarea
          ref={textareaRef}
          id={id}
          className={clsx(styles.textarea, {
            [styles.error]: hasError,
          })}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          rows={rows}
          maxLength={maxLength}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          {...rest}
        />

        {(helperText || hasError || (showCount && maxLength)) && (
          <div className={styles.footer}>
            <div className={styles.messageContainer}>
              {hasError && errorMessage && (
                <span id={errorId} className={styles.errorMessage} role="alert">
                  {errorMessage}
                </span>
              )}
              {!hasError && helperText && (
                <span id={helperId} className={styles.helperText}>
                  {helperText}
                </span>
              )}
            </div>
            {showCount && maxLength && (
              <span
                id={`${id}-count`}
                className={clsx(styles.charCount, {
                  [styles.charCountNearLimit]:
                    typeof value === 'string' && value.length >= maxLength * 0.9,
                  [styles.charCountExceeded]:
                    typeof value === 'string' && value.length > maxLength,
                })}
              >
                {typeof value === 'string' ? value.length : 0} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;