'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/features/auth/hooks/useSession';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { RotatingQuote } from '@/features/auth/components/RotatingQuote';
import styles from './LoginPageWrapper.module.css';

export default function LoginPageWrapper() {
  const { login, isLoading, isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleGoogleLogin = () => login('google');
  const handleGitHubLogin = () => login('github');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h1 className={styles.title}>
            Find your <span className={styles.highlight}>coding rhythm</span>
          </h1>
          <RotatingQuote className={styles.subtitle} />
          <div className={styles.buttons}>
            <OAuthButtons
              onGoogleClick={handleGoogleLogin}
              onGitHubClick={handleGitHubLogin}
              isLoading={isLoading}
            />
          </div>
          <p className={styles.note}>
            By continuing, you agree to our{' '}
            <a href="/terms" className={styles.link}>Terms</a> and{' '}
            <a href="/privacy" className={styles.link}>Privacy Policy</a>.
          </p>
          <div className={styles.metronome} aria-hidden="true">
            <div className={styles.metronomeDot}></div>
            <div className={styles.metronomeDot}></div>
            <div className={styles.metronomeDot}></div>
          </div>
        </div>
      </div>

      {/* Capillary waves – now generated with a loop (DRY) */}
      <div className={styles.capillaryBackground} aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className={styles.capillaryRing} />
        ))}
      </div>
    </div>
  );
}