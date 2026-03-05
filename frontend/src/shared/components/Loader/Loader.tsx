"use client";

import React from 'react';
import clsx from 'clsx';
import styles from './Loader.module.css';

export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the loader.
   * @default 'md'
   */
  size?: LoaderSize;
  /**
   * Optional text displayed below the loader.
   */
  text?: string;
  /**
   * If true, the loader covers the entire viewport with a backdrop.
   * @default false
   */
  fullScreen?: boolean;
  /**
   * If true, shows a semi‑transparent backdrop behind the loader (useful for inline loading).
   * @default false
   */
  overlay?: boolean;
  /**
   * Additional CSS class names.
   */
  className?: string;
}

/**
 * Loader component – a modern, minimal ring loader.
 * Represents a radar‑like pulse, evoking focus and consistency.
 */
const Loader = React.forwardRef<HTMLDivElement, LoaderProps>(
  (
    {
      size = 'md',
      text,
      fullScreen = false,
      overlay = false,
      className,
      ...rest
    },
    ref
  ) => {
    const loaderContent = (
      <div
        ref={ref}
        className={clsx(
          styles.loader,
          styles[`size-${size}`],
          {
            [styles.fullScreen]: fullScreen,
            [styles.overlay]: overlay,
          },
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={text || 'Loading'}
        {...rest}
      >
        <div className={styles.ringContainer} aria-hidden="true">
          <div className={styles.ring}></div>
          <div className={styles.core}></div>
        </div>
        {text && <span className={styles.text}>{text}</span>}
      </div>
    );

    // If fullScreen or overlay, wrap in a backdrop container
    if (fullScreen || overlay) {
      return (
        <div
          className={clsx(styles.backdrop, {
            [styles.fullScreenBackdrop]: fullScreen,
          })}
        >
          {loaderContent}
        </div>
      );
    }

    return loaderContent;
  }
);

Loader.displayName = 'Loader';

export default Loader;