"use client";

import React from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import Button, { ButtonProps } from '@/shared/components/Button';
import clsx from 'clsx';
import styles from './OAuthButton.module.css';

export interface OAuthButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  /**
   * OAuth provider: 'google' or 'github'.
   * If not provided, you must supply either `href` or `onClick`.
   */
  provider?: 'google' | 'github';
  /**
   * Custom URL to redirect to. If not provided and `provider` is set,
   * defaults to `${NEXT_PUBLIC_API_BASE_URL}/auth/${provider}`.
   */
  href?: string;
  /**
   * Custom click handler. If provided, navigation is not automatic.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Whether to show the provider icon. Defaults to `true`.
   */
  showIcon?: boolean;
  /**
   * Override the default button text.
   */
  children?: React.ReactNode;
}

/**
 * OAuthButton – A themed button for OAuth login with Google or GitHub.
 *
 * It can be used as a link (via `href`) or with a custom `onClick` handler.
 * When `provider` is given, the default text and icon are set automatically.
 * The button inherits all props from the shared Button component.
 */
const OAuthButton = React.forwardRef<HTMLButtonElement, OAuthButtonProps>(
  (
    {
      provider,
      href,
      onClick,
      showIcon = true,
      children,
      className,
      disabled,
      isLoading,
      variant = 'secondary',
      size = 'md',
      ...rest
    },
    ref
  ) => {
    // Determine the default icon and text based on provider
    let Icon = null;
    let defaultText = '';

    if (provider === 'google') {
      Icon = FaGoogle;
      defaultText = 'Continue with Google';
    } else if (provider === 'github') {
      Icon = FaGithub;
      defaultText = 'Continue with GitHub';
    }

    // Compute the default href if provider is given and no custom href
    let computedHref = href;
    if (!computedHref && provider) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      // Remove trailing slash if present
      const cleanBase = baseUrl.replace(/\/$/, '');
      computedHref = `${cleanBase}/auth/${provider}`;
    }

    // Handle click: either call custom onClick or navigate to computedHref
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      if (disabled || isLoading) return;

      if (onClick) {
        onClick(e);
      } else if (computedHref) {
        e.preventDefault();
        window.location.href = computedHref;
      }
    };

    // Render the button
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled}
        isLoading={isLoading}
        onClick={handleClick}
        className={clsx(styles.oauthButton, className)}
        leftIcon={showIcon && Icon ? <Icon /> : undefined}
        {...rest}
      >
        {children ?? defaultText}
      </Button>
    );
  }
);

OAuthButton.displayName = 'OAuthButton';

export default OAuthButton;