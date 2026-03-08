import React from 'react';
import { FiInbox } from 'react-icons/fi';
import clsx from 'clsx';
import Button from '../Button';
import styles from './NoRecordFound.module.css';

export interface NoRecordFoundProps {
  /** Main message to display */
  message?: string;
  /** Optional icon (defaults to FiInbox) */
  icon?: React.ReactNode;
  /** Optional retry callback – if provided, shows a retry button */
  onRetry?: () => void;
  /** Text for retry button (default: "Try again") */
  retryText?: string;
  /** Additional CSS class for the container */
  className?: string;
  /** Optional children to replace default content (overrides message/icon/retry) */
  children?: React.ReactNode;
}

export const NoRecordFound: React.FC<NoRecordFoundProps> = ({
  message = 'No records found',
  icon = <FiInbox className={styles.defaultIcon} />,
  onRetry,
  retryText = 'Try again',
  className,
  children,
}) => {
  if (children) {
    return <div className={clsx(styles.container, className)}>{children}</div>;
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.iconWrapper}>{icon}</div>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className={styles.retryButton}>
          {retryText}
        </Button>
      )}
    </div>
  );
};

export default React.memo(NoRecordFound);