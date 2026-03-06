// F:\PERSONAL\DevRhythm\frontend\src\app\test\page.tsx
"use client";

import React, { useState } from 'react';
import {
  FaUserFriends,
  FaCalendarTimes,
  FaExclamationTriangle,
  FaRocket,
  FaBug,
} from 'react-icons/fa';
import EmptyState from '@/shared/components/EmptyState';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import Button from '@/shared/components/Button';
import styles from './page.module.css'; // optional, for page layout

/**
 * A component that deliberately throws an error to test ErrorBoundary.
 */
const BuggyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('💥 This is a test error from BuggyComponent!');
  }
  return <p className={styles.normalText}>✅ Everything is fine here.</p>;
};

export default function TestPage() {
  const [triggerError, setTriggerError] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleThrowError = () => {
    setTriggerError(true);
  };

  const handleReset = () => {
    setTriggerError(false);
    setResetKey(prev => prev + 1); // force ErrorBoundary to remount
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Component Test Page</h1>

      {/* ===== EmptyState Examples ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>EmptyState</h2>

        <div className={styles.grid}>
          <EmptyState
            title="No followers yet"
            description="When someone follows you, they'll appear here."
            icon={<FaUserFriends />}
          />

          <EmptyState
            title="No revisions scheduled"
            description="You don't have any upcoming revisions. Create a revision schedule to get started."
            icon={<FaCalendarTimes />}
            action={<Button variant="primary" size="sm">Schedule Revision</Button>}
          />

          <EmptyState
            title="No search results"
            description="Try adjusting your search or filter to find what you're looking for."
          />

          <EmptyState
            title="Welcome to DevRhythm!"
            description="Get started by exploring questions, setting goals, or joining a study group."
            icon={<FaRocket />}
            action={<Button variant="primary" size="sm">Explore</Button>}
          />
        </div>
      </section>

      {/* ===== ErrorBoundary Examples ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ErrorBoundary</h2>

        <div className={styles.grid}>
          {/* Basic ErrorBoundary with default fallback */}
          <div className={styles.card}>
            <h3>Default Fallback</h3>
            <ErrorBoundary>
              <BuggyComponent shouldThrow={triggerError} />
            </ErrorBoundary>
            <div className={styles.buttonGroup}>
              <Button variant="outline" size="sm" onClick={handleThrowError} leftIcon={<FaBug />}>
                Throw Error
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>

          {/* ErrorBoundary with custom fallback */}
          <div className={styles.card}>
            <h3>Custom Fallback</h3>
            <ErrorBoundary
              key={resetKey} // force re‑creation on reset
              fallback={(error, reset) => (
                <div className={styles.customFallback}>
                  <FaExclamationTriangle size={24} />
                  <p><strong>Custom Error UI:</strong> {error.message}</p>
                  <Button variant="primary" size="sm" onClick={reset}>
                    Retry
                  </Button>
                </div>
              )}
            >
              <BuggyComponent shouldThrow={triggerError} />
            </ErrorBoundary>
            <div className={styles.buttonGroup}>
              <Button variant="outline" size="sm" onClick={handleThrowError} leftIcon={<FaBug />}>
                Throw Error
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}