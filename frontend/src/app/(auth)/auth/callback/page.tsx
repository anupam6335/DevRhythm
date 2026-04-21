import { Suspense } from 'react';
import { AuthCallbackHandler } from '@/features/auth/components/AuthCallbackHandler';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './page.module.css';

export default function CallbackPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className={styles.loading}>
            <SkeletonLoader variant="custom" width={300} height={120} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading...</p>
          </div>
        }
      >
        <AuthCallbackHandler />
      </Suspense>
    </>
  );
}