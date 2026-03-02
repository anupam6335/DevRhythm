'use client';

import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import Toast, { ToastType, ToastProps } from './Toast';

// Re-export hotToast for advanced usage (optional)
export { hotToast };

// Custom toast functions that use our themed Toast component
export const toast = {
  success: (message: string, options?: Partial<Omit<ToastProps, 't' | 'message' | 'type'>>) =>
    hotToast.custom(
      (t) => <Toast t={t} message={message} type="success" {...options} />,
      { duration: 4000, ...options }
    ),
  error: (message: string, options?: Partial<Omit<ToastProps, 't' | 'message' | 'type'>>) =>
    hotToast.custom(
      (t) => <Toast t={t} message={message} type="error" {...options} />,
      { duration: 5000, ...options }
    ),
  info: (message: string, options?: Partial<Omit<ToastProps, 't' | 'message' | 'type'>>) =>
    hotToast.custom(
      (t) => <Toast t={t} message={message} type="info" {...options} />,
      { duration: 4000, ...options }
    ),
  warning: (message: string, options?: Partial<Omit<ToastProps, 't' | 'message' | 'type'>>) =>
    hotToast.custom(
      (t) => <Toast t={t} message={message} type="warning" {...options} />,
      { duration: 4000, ...options }
    ),
  // Generic method to show any toast (you can pass a custom type or component)
  custom: (render: (t: any) => React.ReactNode, options?: any) =>
    hotToast.custom(render, options),
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