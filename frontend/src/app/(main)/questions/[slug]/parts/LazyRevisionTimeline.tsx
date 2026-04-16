'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import SkeletonLoader from '@/shared/components/SkeletonLoader';

const RevisionTimelinePanel = dynamic(
  () => import('./RevisionTimelinePanel').then(mod => mod.RevisionTimelinePanel),
  { loading: () => <RevisionTimelineSkeleton /> }
);

interface LazyRevisionTimelineProps {
  revision?: any;
  questionId: string;
}

export const LazyRevisionTimeline: React.FC<LazyRevisionTimelineProps> = (props) => {
  return <RevisionTimelinePanel {...props} />;
};

const RevisionTimelineSkeleton: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <SkeletonLoader variant="avatar" width={24} height={24} />
        <SkeletonLoader variant="text" width="60%" height={20} />
      </div>
    ))}
  </div>
);