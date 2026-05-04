'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '@/features/auth/hooks/useSession';
import { useUsers } from '@/features/community/hooks/useUsers';
import FilterPanel, { type SortItem } from './FilterPanel';
import Pagination from '@/shared/components/Pagination';
import Breadcrumb from '@/shared/components/Breadcrumb';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';
import styles from './CommunityPage.module.css';

const PAGE_SIZE = 20;

// Lazy load UserList with skeleton
const UserList = dynamic(
  () => import('./UserList'),
  {
    ssr: false,
    loading: () => (
      <div className={styles.userList}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    ),
  }
);

export default function CommunityPage() {
  const { user, isAuthenticated } = useSession();
  const [search, setSearch] = useState('');
  const [sorts, setSorts] = useState<SortItem[]>([{ field: 'totalSolved', order: 'desc' }]);
  const [currentPage, setCurrentPage] = useState(1);
  const dotsRef = useRef<HTMLDivElement>(null);

  const { ref: listRef, inView } = useInView({
    triggerOnce: true,      // Load only once when first seen
    rootMargin: '200px',    // Start loading 200px before it enters viewport
    threshold: 0,
  });

  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (dotsRef.current) {
        dotsRef.current.style.transform = `translateY(${window.scrollY * 0.02}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset page when search or sorts change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sorts]);

  const buildSortParams = useCallback(() => {
    if (sorts.length === 0) return { sortBy: 'totalSolved', sortOrder: 'desc' };
    const sortBy = sorts.map(s => s.field).join(',');
    const sortOrder = sorts.map(s => s.order).join(',');
    return { sortBy, sortOrder };
  }, [sorts]);

  const { sortBy, sortOrder } = buildSortParams();

  const { data, isLoading, error, refetch } = useUsers(
    {
      page: currentPage,
      limit: PAGE_SIZE,
      search: search || undefined,
      sortBy,
      sortOrder,
    },
    { enabled: true }
  );

  const handleFiltersChange = (filters: { sorts: SortItem[] }) => {
    setSorts(filters.sorts);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const users = data?.users || [];
  const pagination = data?.pagination;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Community' },
  ];

  return (
    <>
      <div ref={dotsRef} className={styles.parallaxDots} aria-hidden="true" />
      <div className={styles.container}>
        <Breadcrumb items={breadcrumbItems} />
        <div className={styles.pageHeader}>
          <h1>Community</h1>
          <p>Find your coding companions. See who’s on the same rhythm.</p>
        </div>

        <FilterPanel
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
          isAuthenticated={!!user}
          initialSorts={sorts}
        />

        {/* Lazy-loaded UserList – only loads when scrolled into view */}
        <div ref={listRef}>
          {inView && (
            <UserList
              users={users}
              isLoading={isLoading}
              error={error as Error | null}
              isAuthenticated={!!user}
              onRetry={() => refetch()}
            />
          )}
        </div>

        {pagination && pagination.total > 0 && inView && (
          <div className={styles.paginationWrapper}>
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
              showFirstLast
              showPrevNext
              size="md"
            />
          </div>
        )}
      </div>
    </>
  );
}