"use client";

import React, { useCallback, useMemo } from 'react';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import Button, { ButtonProps } from '@/shared/components/Button';
import clsx from 'clsx';
import styles from './OAuthButton.module.css';

export interface OAuthButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  provider?: 'google' | 'github';
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  showIcon?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({
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
  ref,
  ...rest
}) => {
  const { Icon, defaultText } = useMemo(() => {
    if (provider === 'google') return { Icon: FaGoogle, defaultText: 'Continue with Google' };
    if (provider === 'github') return { Icon: FaGithub, defaultText: 'Continue with GitHub' };
    return { Icon: null, defaultText: '' };
  }, [provider]);

  const computedHref = useMemo(() => {
    if (href) return href;
    if (provider) {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const cleanBase = baseUrl.replace(/\/$/, '');
      return `${cleanBase}/auth/${provider}`;
    }
    return undefined;
  }, [href, provider]);

  const handleClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      if (disabled || isLoading) return;
      if (onClick) onClick(e);
      else if (computedHref) {
        e.preventDefault();
        window.location.href = computedHref;
      }
    },
    [disabled, isLoading, onClick, computedHref]
  );

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
};

OAuthButton.displayName = 'OAuthButton';

export default React.memo(OAuthButton);