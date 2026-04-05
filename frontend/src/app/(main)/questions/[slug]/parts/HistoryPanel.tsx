'use client';

import React, { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Button from '@/shared/components/Button';
import { useCodeHistory } from '@/features/codeExecution/hooks/useCodeHistory';
import SkeletonLoader from '@/shared/components/SkeletonLoader';

interface HistoryPanelProps {
  questionId: string;
  onLoad: (code: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ questionId, onLoad }) => {
  const { data, isLoading, error, refetch } = useCodeHistory(questionId, { limit: 10, page: 1 });

  useEffect(() => {
    refetch(); // fetch when panel becomes active
  }, [refetch]);

  if (isLoading) return <SkeletonLoader count={3} height={60} />;
  if (error) return <p>Failed to load history.</p>;
  if (!data?.history?.length) return <p>No execution history found.</p>;

  return (
    <div>
      {data.history.map(entry => (
        <div
          key={entry._id}
          style={{
            borderBottom: '1px solid var(--border)',
            padding: '0.5rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>{entry.language}</strong> ·{' '}
            {formatDistanceToNow(new Date(entry.executedAt), { addSuffix: true })}
            <br />
            <small>
              {entry.summary.passedCount}/{entry.summary.totalCount} passed
            </small>
          </div>
          <Button size="sm" onClick={() => onLoad(entry.code)}>
            Load
          </Button>
        </div>
      ))}
    </div>
  );
};