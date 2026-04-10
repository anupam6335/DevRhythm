'use client';

import React, { Suspense } from 'react';
import { useLazyLoad } from '@/shared/hooks/useLazyLoad';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import type { Question } from '@/shared/types';
import styles from './QuestionList.module.css';

const QuestionList = React.lazy(() => import('./QuestionList').then(module => ({ default: module.QuestionList })));

interface LazyQuestionListProps {
  questions: Question[];
  isLoading?: boolean;
}

export const LazyQuestionList: React.FC<LazyQuestionListProps> = ({ questions, isLoading }) => {
  const { ref, shouldLoad } = useLazyLoad({ rootMargin: '200px' });

  // If still loading initial data, show skeleton immediately
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} variant="custom" className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <Suspense
          fallback={
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonLoader key={i} variant="custom" className={styles.skeletonCard} />
              ))}
            </div>
          }
        >
          <QuestionList questions={questions} isLoading={false} />
        </Suspense>
      ) : (
        // Show skeleton placeholders until the component loads
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.skeletonCard} />
          ))}
        </div>
      )}
    </div>
  );
};