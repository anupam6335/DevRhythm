'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/features/auth/hooks/useSession';
import Button from '@/shared/components/Button';
import Loader from '@/shared/components/Loader';
import styles from './page.module.css';

export default function DashboardPage() {
  const { user, isLoading, logout } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="devRhythmContainer">Loading...</div>;
  }

  if (isLoading) return <div className="devRhythmContainer"><Loader/></div>;
  if (!user) return <div className="devRhythmContainer">Not authenticated</div>;

  return (
    <div className="devRhythmContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome back, {user.displayName}! 👋</h1>

        {/* Construction card with breathing animation */}
        <div className={styles.constructionCard}>
          {/* Breathing background container */}
          <div className={styles.breathingBackground} aria-hidden="true"></div>

          <div className={styles.constructionContent}>
            <div className={styles.constructionHeader}>
              <span className={styles.emoji}>🚧👷‍♂️🚧</span>
              <h2>Dashboard? More like Dash‑Bored!</h2>
            </div>
            <p className={styles.constructionMessage}>
              Our developers are currently wrestling with bugs, drinking chai, and building something epic.
              Come back soon – or better yet, keep solving problems while you wait. They’re way more fun anyway!
            </p>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} style={{ width: '42%' }}></div>
              <span className={styles.progressLabel}>42% ready (estimated by random number generator)</span>
            </div>
            <p className={styles.constructionFooter}>
              P.S. If you see any glitches, just pretend they’re features. 😉
            </p>
          </div>
        </div>

        {/* Optional logout button */}
        <div className={styles.logoutSection}>
          <Button onClick={logout} variant="outline">Logout</Button>
        </div>
      </div>
    </div>
  );
}