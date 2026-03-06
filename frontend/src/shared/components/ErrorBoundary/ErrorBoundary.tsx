import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import clsx from 'clsx';
import Button from '@/shared/components/Button';
import styles from './ErrorBoundary.module.css';

export interface ErrorBoundaryProps {
  /**
   * Content to be rendered when no error has occurred.
   */
  children: ReactNode;

  /**
   * Custom fallback UI. Can be a React node or a render function
   * that receives the error and a reset function.
   */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);

  /**
   * Callback fired when an error is caught.
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Additional CSS class for the fallback container.
   */
  className?: string;

  /**
   * Array of values that, when changed, will reset the error boundary.
   * Useful for forcing a retry after an error.
   */
  resetKeys?: any[];

  /**
   * If true, the boundary will reset when its props change (even without resetKeys).
   */
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary that catches JavaScript errors in its child component tree,
 * logs them, and displays a fallback UI.
 *
 * @example
 * <ErrorBoundary
 *   fallback={<p>Something went wrong</p>}
 *   onError={(error, info) => myLogger(error, info)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    // You can also log to an external service here
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.hasError) return;

    // Reset the error boundary if resetKeys have changed
    if (this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys ?? [];
      const currKeys = this.props.resetKeys ?? [];
      if (prevKeys.length !== currKeys.length || prevKeys.some((key, i) => key !== currKeys[i])) {
        this.reset();
        return;
      }
    }

    // Reset on any prop change if enabled
    if (this.props.resetOnPropsChange && prevProps !== this.props) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, className } = this.props;

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }

      // Default fallback UI
      const defaultFallback = (
        <div className={clsx(styles.container, className)} role="alert" aria-live="assertive">
          <FaExclamationTriangle className={styles.icon} aria-hidden="true" />
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>{error.message || 'An unexpected error occurred.'}</p>
          <Button
            variant="primary"
            size="md"
            leftIcon={<FaRedo />}
            onClick={this.reset}
            className={styles.button}
          >
            Try again
          </Button>
        </div>
      );

      return fallback ?? defaultFallback;
    }

    return children;
  }
}

export default ErrorBoundary;