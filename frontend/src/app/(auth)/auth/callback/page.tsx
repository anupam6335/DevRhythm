import { Suspense } from 'react';
import { AuthCallbackHandler } from '@/features/auth/components/AuthCallbackHandler';
import styles from './page.module.css';

export default function CallbackPage() {
  return (
    <div className="devRhythmContainer">
      <div className={styles.container}>
        <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
          <AuthCallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}