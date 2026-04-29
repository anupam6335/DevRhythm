'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiPlus } from 'react-icons/fi';
import { usePlannedGoals, useDeletePlannedGoal } from '@/features/goal';
import PlannedGoalItem from './PlannedGoalItem';
import Pagination from '@/shared/components/Pagination';
import SkeletonLoader from '@/shared/components/SkeletonLoader';
import Button from '@/shared/components/Button';
import styles from './PlannedGoalsList.module.css';

interface PlannedGoalsListProps {
  showCreateButton?: boolean;
  itemsPerPage?: number;
}

export default function PlannedGoalsList({
  showCreateButton = true,
  itemsPerPage = 5,
}: PlannedGoalsListProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = usePlannedGoals({
    page,
    limit: itemsPerPage,
  });

  const deleteMutation = useDeletePlannedGoal();

  const handleDelete = (goalId: string) => {
    deleteMutation.mutate(goalId);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Planned goals</h2>
          {showCreateButton && (
            <div className={styles.skeletonButton} />
          )}
        </div>
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} variant="custom" className={styles.skeletonItem} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Planned goals</h2>
        </div>
        <div className={styles.errorContainer}>
          <p>Unable to load planned goals.</p>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const goals = data?.goals || [];
  const pagination = data?.pagination;
  const totalPages = pagination?.pages || 1;

  // Sort: active first, then by endDate ascending
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  });

  const isDeletingId = deleteMutation.variables;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Planned goals</h2>
        {showCreateButton && (
          <Link href="/goals/create" passHref legacyBehavior>
            <Button variant="primary" size="md" asChild className={styles.createButton}>
              <a>
                <FiPlus /> Create new goal
              </a>
            </Button>
          </Link>
        )}
      </div>

      {sortedGoals.length === 0 ? (
        <div className={styles.emptyState}>
          <FiPlus size={32} className={styles.emptyIcon} />
          <p>No planned goals yet. Create your first one to stay on track.</p>
          <Link href="/goals/create" passHref legacyBehavior>
            <Button variant="primary" size="sm" asChild>
              <a>Create goal</a>
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {sortedGoals.map((goal) => (
              <PlannedGoalItem
                key={goal._id}
                goal={goal}
                onDelete={handleDelete}
                isDeleting={isDeletingId === goal._id}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                siblingCount={1}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}