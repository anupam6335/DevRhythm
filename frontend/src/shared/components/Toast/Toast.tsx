import React from 'react';
import { toast as hotToast, Toast as HotToast } from 'react-hot-toast';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  /** The toast instance from react-hot-toast */
  t: HotToast;
  /** Message to display */
  message: string;
  /** Type of toast (affects icon and color) */
  type?: ToastType;
  /** Custom icon (overrides default) */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <FaCheckCircle />,
  error: <FaExclamationCircle />,
  info: <FaInfoCircle />,
  warning: <FaExclamationTriangle />,
};

export const Toast: React.FC<ToastProps> = ({
  t,
  message,
  type = 'info',
  icon,
  className = '',
}) => {
  const Icon = icon ?? iconMap[type];

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${className} ${
        t.visible ? styles.visible : ''
      }`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={styles.icon}>{Icon}</div>
      <div className={styles.message}>{message}</div>
      <button
        onClick={() => hotToast.dismiss(t.id)}
        className={styles.closeButton}
        aria-label="Dismiss notification"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;