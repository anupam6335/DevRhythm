'use client';

import React from 'react';
import { Toaster, toast as hotToast, ToastOptions } from 'react-hot-toast';
import Toast, { ToastProps } from './Toast';

// Re-export hotToast for advanced usage
export { hotToast };

// Custom toast functions using our themed Toast component
export const toast = {
  success: (
    message: string,
    options?: Omit<Partial<ToastProps>, 't' | 'message' | 'type'> & ToastOptions
  ) => {
    const { icon, className, ...toastOptions } = options || {};
    return hotToast.custom(
      (t) => <Toast t={t} message={message} type="success" icon={icon} className={className} />,
      { duration: 4000, ...toastOptions }
    );
  },
  error: (
    message: string,
    options?: Omit<Partial<ToastProps>, 't' | 'message' | 'type'> & ToastOptions
  ) => {
    const { icon, className, ...toastOptions } = options || {};
    return hotToast.custom(
      (t) => <Toast t={t} message={message} type="error" icon={icon} className={className} />,
      { duration: 5000, ...toastOptions }
    );
  },
  info: (
    message: string,
    options?: Omit<Partial<ToastProps>, 't' | 'message' | 'type'> & ToastOptions
  ) => {
    const { icon, className, ...toastOptions } = options || {};
    return hotToast.custom(
      (t) => <Toast t={t} message={message} type="info" icon={icon} className={className} />,
      { duration: 4000, ...toastOptions }
    );
  },
  warning: (
    message: string,
    options?: Omit<Partial<ToastProps>, 't' | 'message' | 'type'> & ToastOptions
  ) => {
    const { icon, className, ...toastOptions } = options || {};
    return hotToast.custom(
      (t) => <Toast t={t} message={message} type="warning" icon={icon} className={className} />,
      { duration: 4000, ...toastOptions }
    );
  },
  // Generic method to show any toast (pass a custom render function)
  custom: hotToast.custom,
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
};

interface ToastProviderProps {
  children: React.ReactNode;
  /**
   * Position of the toasts container (default: bottom-right)
   */
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  /**
   * Reverse order (newest on top)
   */
  reverseOrder?: boolean;
  /**
   * Gap between toasts
   */
  gutter?: number;
  /**
   * Container style
   */
  containerStyle?: React.CSSProperties;
  /**
   * Container className
   */
  containerClassName?: string;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  reverseOrder = false,
  gutter = 8,
  containerStyle,
  containerClassName,
}) => {
  return (
    <>
      {children}
      <Toaster
        position={position}
        reverseOrder={reverseOrder}
        gutter={gutter}
        containerStyle={containerStyle}
        containerClassName={containerClassName}
        // We are using custom toasts, so we can keep default toast options minimal
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
};

export default ToastProvider;