"use client";

import React, { memo } from 'react';
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
  custom: hotToast.custom,
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
};

export interface ToastProviderProps {
  children: React.ReactNode;
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  reverseOrder?: boolean;
  gutter?: number;
  containerStyle?: React.CSSProperties;
  containerClassName?: string;
}

export const ToastProvider: React.FC<ToastProviderProps> = memo(
  ({
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
          toastOptions={{ duration: 4000 }}
        />
      </>
    );
  }
);

ToastProvider.displayName = 'ToastProvider';

export default ToastProvider;