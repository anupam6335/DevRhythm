'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMediaQuery } from '@/shared/hooks';
import Divider from '@/shared/components/Divider';
import Button from '@/shared/components/Button';
import Pagination from '@/shared/components/Pagination';
import { useQuestions } from '../hooks/useQuestions';
import { useStatistics } from '../hooks/useStatistics';
import { usePatterns } from '../hooks/usePatterns';
import { useTags } from '../hooks/useTags';
import { QuestionList } from './QuestionList';
import { QuestionFilterSidebar } from './QuestionFilterSidebar';
import { QuestionFilterDrawer } from './QuestionFilterDrawer';
import type { Filters } from './QuestionFilterControls';
import styles from './QuestionsPageClient.module.css';
import Link from 'next/link';

const DEFAULT_FILTERS: Filters = {
  search: '',
  platform: '',
  difficulty: '',
  pattern: '',
  tags: [],
  sort: 'newest',
};

// Map frontend sort value to backend parameters
const sortParamMap: Record<string, { sortBy: string; sortOrder: 'asc' | 'desc' }> = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
  difficulty: { sortBy: 'difficulty', sortOrder: 'asc' },
  title: { sortBy: 'title', sortOrder: 'asc' },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'title', label: 'Title' },
];

export const QuestionsPageClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 940px)');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Parse URL params into filters (including sort)
  const filters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const sort = params.get('sort') || DEFAULT_FILTERS.sort;
    return {
      search: params.get('search') || DEFAULT_FILTERS.search,
      platform: params.get('platform') || DEFAULT_FILTERS.platform,
      difficulty: params.get('difficulty') || DEFAULT_FILTERS.difficulty,
      pattern: params.get('pattern') || DEFAULT_FILTERS.pattern,
      tags: params.getAll('tags'),
      sort,
    };
  }, [searchParams]);

  // Update URL when filters change
  const updateFilters = (key: keyof Filters, value: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (key === 'tags') {
      params.delete('tags');
      (value as string[]).forEach((tag) => params.append('tags', tag));
    } else if (key === 'sort') {
      params.set('sort', value);
    } else {
      if (value && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset page when filters change
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('?page=1');
  };

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  // Build params for useQuestions, including sort
  const queryParams = useMemo(() => {
    const params: any = { page, limit };
    if (filters.search) params.search = filters.search;
    if (filters.platform) params.platform = filters.platform;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.pattern) params.pattern = filters.pattern;
    if (filters.tags.length) params.tags = filters.tags;

    // Add sort parameters
    const sortParams = sortParamMap[filters.sort];
    if (sortParams) {
      params.sortBy = sortParams.sortBy;
      params.sortOrder = sortParams.sortOrder;
    }

    return params;
  }, [page, limit, filters]);

  const {
    data: questionsData,
    isLoading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = useQuestions(queryParams);

  const { data: statsData } = useStatistics();
  const { data: patternsData } = usePatterns();
  const { data: tagsData } = useTags();

  const questions = questionsData?.questions ?? [];
  const pagination = questionsData?.pagination;

  // Options for dropdowns
  const platformOptions = useMemo(() => {
    if (!statsData) return [];
    return Object.keys(statsData.byPlatform).map((p) => ({ value: p, label: p }));
  }, [statsData]);

  const difficultyOptions = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' },
  ];

  const patternOptions = useMemo(() => {
    return (patternsData ?? []).map((p) => ({ value: p, label: p }));
  }, [patternsData]);

  const tagOptions = useMemo(() => {
    return (tagsData ?? []).map((t) => ({ value: t, label: t }));
  }, [tagsData]);

  // Error state
  if (questionsError) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>Failed to load questions</h2>
          <p>{(questionsError as Error).message || 'An unknown error occurred'}</p>
          <Button onClick={() => refetchQuestions()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Range display
  const start = questions.length ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, pagination?.total ?? 0);
  const total = pagination?.total ?? 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Questions Bank</h1>
        <div className={styles.headerActions}>
          {!isDesktop && (
            <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
              Filter
            </Button>
          )}
          <Button asChild size={!isDesktop ? 'sm' : 'md'}>
            <Link href="/questions/create">Create New</Link>
          </Button>
        </div>
      </div>
      <Divider />
      {/* Desktop layout with sidebar */}
      {isDesktop ? (
        <div className={styles.desktopLayout}>
          <QuestionFilterSidebar
            filters={filters}
            onFilterChange={updateFilters}
            onClearFilters={clearFilters}
            stats={statsData}
            platformOptions={platformOptions}
            difficultyOptions={difficultyOptions}
            patternOptions={patternOptions}
            tagOptions={tagOptions}
            sortOptions={SORT_OPTIONS}
          />
          <main className={styles.main}>
            <div className={styles.resultInfo}>
              <span>
                Showing {start}–{end} of {total} questions
              </span>
            </div>
            <QuestionList questions={questions} isLoading={questionsLoading} />
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                siblingCount={2}
                onPageChange={(page) => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', page.toString());
                  router.push(`?${params.toString()}`);
                }}
              />
            )}
          </main>
        </div>
      ) : (
        // Mobile/tablet layout with drawer
        <>
          <div className={styles.mobileHeader}>
            <div className={styles.resultInfo}>
              <span>
                Showing {start}–{end} of {total} questions
              </span>
            </div>
            <div className={styles.sortRow}>
              <select
                value={filters.sort}
                onChange={(e) => updateFilters('sort', e.target.value)}
                className={styles.sortSelect}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <QuestionList questions={questions} isLoading={questionsLoading} />
          {pagination && pagination.pages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                siblingCount={2}
                onPageChange={(page) => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', page.toString());
                  router.push(`?${params.toString()}`);
                }}
              />
            </div>
          )}
          <QuestionFilterDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            filters={filters}
            onFilterChange={updateFilters}
            onClearFilters={clearFilters}
            stats={statsData}
            platformOptions={platformOptions}
            difficultyOptions={difficultyOptions}
            patternOptions={patternOptions}
            tagOptions={tagOptions}
            sortOptions={SORT_OPTIONS}
          />
        </>
      )}
    </div>
  );
};