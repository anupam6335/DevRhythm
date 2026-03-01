"use client";

import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import clsx from 'clsx';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  fullWidth?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      asChild = false,
      className,
      disabled,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const buttonContent = (
      <>
        {isLoading && <FaSpinner className={styles.spinner} aria-hidden="true" />}
        {!isLoading && leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </>
    );

    const buttonClasses = clsx(
      styles.button,
      styles[variant],
      styles[size],
      {
        [styles.fullWidth]: fullWidth,
        [styles.loading]: isLoading,
      },
      className
    );

    const commonProps = {
      className: buttonClasses,
      disabled: isDisabled,
      'aria-disabled': isDisabled,
      'aria-busy': isLoading,
      type,
      ...rest,
    };

    if (asChild && React.isValidElement(children)) {
      const child = React.Children.only(children) as React.ReactElement;
      return React.cloneElement(child, {
        ref,
        ...commonProps,
        className: clsx(commonProps.className, (child.props as { className?: string }).className),
      });
    }

    return (
      <button ref={ref} {...commonProps}>
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;