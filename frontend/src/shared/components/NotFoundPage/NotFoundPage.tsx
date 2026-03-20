'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { HiHome } from 'react-icons/hi';
import Button from '@/shared/components/Button';
import styles from './NotFoundPage.module.css';

export interface NotFoundPageProps {
  className?: string;
  title?: string;
  message?: string;
  actionText?: string;
  actionHref?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  className,
  title = 'Page not found',
  message = 'Sorry, we couldn’t find the page you’re looking for.',
  actionText = 'Go back home',
  actionHref,
}) => {
  // Memoize the event handler to avoid recreation on each render
  const preventDownload = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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
        {actionHref && (
          <Button
            asChild
            variant="primary"
            size="lg"
            leftIcon={<HiHome />}
            className={styles.button}
          >
            <Link href={actionHref}>{actionText}</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default React.memo(NotFoundPage);