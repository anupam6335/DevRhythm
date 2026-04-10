'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { HiHome } from 'react-icons/hi';
import Button from '@/shared/components/Button';
import styles from './NotFoundPage.module.css';

export interface NotFoundPageAction {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
}

export interface NotFoundPageProps {
  className?: string;
  title?: string;
  message?: string;
  actions?: NotFoundPageAction[];
  /** @deprecated Use `actions` instead */
  actionText?: string;
  /** @deprecated Use `actions` instead */
  actionHref?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  className,
  title = 'Page not found',
  message = 'Sorry, we couldn’t find the page you’re looking for.',
  actions,
  actionText,
  actionHref,
}) => {
  const preventDownload = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Determine which buttons to render
  let buttons: NotFoundPageAction[] = [];
  if (actions && actions.length > 0) {
    buttons = actions;
  } else if (actionText && actionHref) {
    buttons = [{ text: actionText, href: actionHref, variant: 'primary' }];
  }

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.content}>
        <div className={styles.big404} aria-hidden="true">404</div>
        <div className={styles.illustration}>
          <Image
            src="/images/illustrations/404-doodle.png"
            alt="Lost in code – 404 illustration"
            width={400}
            height={300}
            priority
            className={styles.image}
            onContextMenu={preventDownload}
            draggable={false}
          />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttonGroup}>
          {buttons.map((btn, idx) => (
            <Button
              key={idx}
              asChild
              variant={btn.variant || 'primary'}
              size="lg"
              leftIcon={btn.variant === 'primary' ? <HiHome /> : undefined}
              className={styles.button}
            >
              <Link href={btn.href}>{btn.text}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(NotFoundPage);