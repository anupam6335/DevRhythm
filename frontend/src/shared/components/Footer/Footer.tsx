import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaGithub, FaLinkedin, FaArrowUp } from 'react-icons/fa';
import { FiAward, FiCheckCircle, FiClock } from 'react-icons/fi';
import clsx from 'clsx';

import { ROUTES } from '@/shared/config';
import Logo from '@/shared/components/Logo';
import Button from '@/shared/components/Button';

import { useUser } from '@/features/user/hooks/useUser';
import { useTodayProgress } from '@/features/user/hooks/useTodayProgress';
import { usePendingRevisions } from '@/features/revision/hooks/usePendingRevisions';

import styles from './Footer.module.css';

export interface FooterProps {
  version?: string;
  className?: string;
}

/**
 * Modern stat display – large numbers with labels.
 */
const StatDisplay: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  href?: string;
  badge?: number;
}> = ({ icon, value, label, href, badge }) => {
  const content = (
    <div className={styles.stat}>
      <span className={styles.statIcon}>{icon}</span>
      <div className={styles.statContent}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={styles.statBadge}>{badge > 9 ? '9+' : badge}</span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={styles.statLink}>
        {content}
      </Link>
    );
  }

  return content;
};

/**
 * Link group – minimal column of links.
 */
const LinkGroup: React.FC<{
  title: string;
  links: Array<{ label: string; href: string }>;
}> = ({ title, links }) => (
  <div className={styles.linkGroup}>
    <h4 className={styles.groupTitle}>{title}</h4>
    <ul className={styles.linkList}>
      {links.map(({ label, href }) => (
        <li key={label}>
          <Link href={href} className={styles.link}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * BackToTop – floating action button.
 */
const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', toggleVisible);
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!visible) return null;

  return (
    <Button
      variant="primary"
      className={styles.backToTop}
      onClick={scrollToTop}
      aria-label="Back to top"
      leftIcon={<FaArrowUp />}
    />
  );
};

export const Footer: React.FC<FooterProps> = ({
  version = '1.0.0',
  className,
}) => {
  const { user } = useUser();
  const { solvedToday } = useTodayProgress();
  const { pendingCount } = usePendingRevisions();

  const isLoggedIn = !!user;
  const streak = user?.streak?.current ?? 0;

  const statDisplays = (
    <div className={styles.statRow}>
      <StatDisplay
        icon={<FiAward />}
        value={streak}
        label="day streak"
        href={isLoggedIn ? ROUTES.PROFILE.ROOT : undefined}
      />
      <StatDisplay
        icon={<FiCheckCircle />}
        value={solvedToday}
        label="solved today"
        href={isLoggedIn ? ROUTES.PROGRESS : undefined}
      />
      <StatDisplay
        icon={<FiClock />}
        value={pendingCount}
        label="revisions"
        href={isLoggedIn ? ROUTES.REVISIONS.OVERDUE : undefined}
        badge={pendingCount}
      />
    </div>
  );

  return (
    <footer className={clsx(styles.footer, className)}>
      <div className={styles.container}>
        {/* Hero section */}
        <div className={styles.hero}>
          <div className={styles.brand}>
            <Logo size="md" layout="horizontal" />
            <p className={styles.tagline}>
              Master coding patterns through deliberate practice.
            </p>
          </div>
          {isLoggedIn ? (
            statDisplays
          ) : (
            <Link href={ROUTES.LOGIN} className={styles.cta}>
              Start your journey →
            </Link>
          )}
        </div>

        {/* Link grid */}
        <div className={styles.linkGrid}>
          <LinkGroup
            title="Learn"
            links={[
              { label: 'Questions', href: ROUTES.QUESTIONS.ROOT },
              { label: 'Patterns', href: ROUTES.QUESTIONS.PATTERNS },
              { label: 'Tags', href: ROUTES.QUESTIONS.TAGS },
            ]}
          />
          <LinkGroup
            title="Community"
            links={[
              { label: 'My Groups', href: ROUTES.GROUPS.MY },
              { label: 'Discover', href: ROUTES.GROUPS.ROOT },
              { label: 'Create Group', href: ROUTES.GROUPS.CREATE },
            ]}
          />
          <LinkGroup
            title="Account"
            links={[
              { label: 'Profile', href: ROUTES.PROFILE.ROOT },
              { label: 'Shares', href: ROUTES.SHARES.ROOT },
              { label: 'Settings', href: '/settings' },
            ]}
          />
          <LinkGroup
            title="Legal"
            links={[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Cookies', href: '/cookies' },
            ]}
          />
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} DevRhythm
          </div>
          <div className={styles.social}>
            <a
              href="https://github.com/anupam6335/DevRhythm"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className={styles.socialLink}
            >
              <FaGithub />
            </a>
            <a
              href="https://www.linkedin.com/in/anupamdebnath6335/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className={styles.socialLink}
            >
              <FaLinkedin />
            </a>
          </div>
          <div className={styles.version}>v{version}</div>
        </div>
      </div>

      <BackToTop />
    </footer>
  );
};

export default React.memo(Footer);