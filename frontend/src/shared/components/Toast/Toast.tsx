"use client";

import React, { memo } from 'react';
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
  t: HotToast;
  message: string;
  type?: ToastType;
  icon?: React.ReactNode;
  className?: string;
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <FaCheckCircle />,
  error: <FaExclamationCircle />,
  info: <FaInfoCircle />,
  warning: <FaExclamationTriangle />,
};

export const Toast: React.FC<ToastProps> = memo(
  ({ t, message, type = 'info', icon, className = '' }) => {
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
  }
);

Toast.displayName = 'Toast';

export default Toast;