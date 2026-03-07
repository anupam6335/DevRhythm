'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/shared/config';
import Button from '@/shared/components/Button';
import styles from './NotFoundPage.module.css';

export interface NotFoundPageProps {
  /** Additional CSS class names for the container */
  className?: string;
  /** Custom message to display (default: "Page not found") */
  message?: string;
  /** Whether to show the "Go home" button (default: true) */
  showHomeButton?: boolean;
  /** Custom click handler for the home button (if not provided, uses Link) */
  onHomeClick?: () => void;
}

/**
 * Full‑page 404 error component.
 * Displays an illustration, a message, and an optional home button.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  className = '',
  message = 'Page not found',
  showHomeButton = true,
  onHomeClick,
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.content}>
        <div className={styles.illustration}>
          <Image
            src="/images/illustrations/404-doodle.png"
            alt="404 illustration"
            width={400}
            height={300}
            priority
            className={styles.image}
          />
        </div>

        <h1 className={styles.title}>404</h1>
        <p className={styles.message}>{message}</p>

        {showHomeButton && (
          <div className={styles.action}>
            {onHomeClick ? (
              <Button onClick={onHomeClick} size="lg">
                Go home
              </Button>
            ) : (
              <Link href={ROUTES.HOME} passHref legacyBehavior>
                <Button as="a" size="lg">
                  Go home
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;