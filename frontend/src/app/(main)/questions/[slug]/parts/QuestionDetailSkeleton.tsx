'use client';

import React from 'react';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import styles from './QuestionDetailPage.module.css';

export const QuestionDetailSkeleton: React.FC = () => {
  return (
    <div className={styles.page}>
      {/* Header skeleton */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <SkeletonLoader variant="text" width="60%" height={32} />
        </div>
        <div className={styles.actions}>
          <SkeletonLoader variant="text" width={100} height={32} />
        </div>
      </div>

      {/* Metadata bar skeleton */}
      <div className={styles.metadataBar}>
        <SkeletonLoader variant="text" width={80} height={24} />
        <SkeletonLoader variant="text" width={60} height={24} />
        <SkeletonLoader variant="text" width={120} height={24} />
        <SkeletonLoader variant="text" width={100} height={24} />
        <SkeletonLoader variant="text" width={100} height={24} />
      </div>

      {/* Progress card skeleton */}
      <div className={styles.progressCardWrapper}>
        <div className={styles.progressCardSkeleton}>
          <div className={styles.progressCardHeader}>
            <SkeletonLoader variant="text" width={200} height={24} />
          </div>
          <div className={styles.progressCardContent}>
            <div className={styles.progressCardLeft}>
              <SkeletonLoader variant="text" width={150} height={20} count={3} />
            </div>
            <div className={styles.progressCardRight}>
              <SkeletonLoader variant="text" width={80} height={40} />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout skeleton */}
      <div className={styles.pageLayout}>
        {/* Left column */}
        <div className={styles.leftColumn}>
          <div className={styles.problemStatement}>
            <div className={styles.tabsSkeleton}>
              <SkeletonLoader variant="text" width={120} height={32} />
              <SkeletonLoader variant="text" width={120} height={32} />
              <SkeletonLoader variant="text" width={120} height={32} />
            </div>
            <div className={styles.problemContentSkeleton}>
              <SkeletonLoader variant="text" count={3} />
              <SkeletonLoader variant="text" width="80%" />
              <SkeletonLoader variant="text" width="90%" />
              <SkeletonLoader variant="text" width="70%" />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightColumn}>
          <div className={styles.codeAreaSkeleton}>
            <div className={styles.codeAreaHeader}>
              <SkeletonLoader variant="text" width={100} height={32} />
              <SkeletonLoader variant="text" width={200} height={32} />
              <SkeletonLoader variant="text" width={80} height={32} />
            </div>
            <SkeletonLoader variant="custom" height={400} width="100%" />
            <div className={styles.testCasesSkeleton}>
              <SkeletonLoader variant="text" width={120} height={24} />
              <div className={styles.testCaseRowSkeleton}>
                <SkeletonLoader variant="text" width="45%" height={60} />
                <SkeletonLoader variant="text" width="45%" height={60} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar questions skeleton */}
      <div className={styles.similarSection}>
        <div className={styles.similarHeader}>
          <SkeletonLoader variant="text" width={200} height={24} />
        </div>
        <div className={styles.similarGridSkeleton}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} variant="card" height={120} />
          ))}
        </div>
      </div>
    </div>
  );
};