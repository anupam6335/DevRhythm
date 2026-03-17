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

const DEFAULT_FILTERS: Filters = {
  search: '',
  platform: '',
  difficulty: '',
  pattern: '',
  tags: [],
  sort: 'newest',
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
  const [sort, setSort] = useState('newest'); // local sort state

  // Parse URL params into filters (excluding sort)
  const filters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    return {
      search: params.get('search') || DEFAULT_FILTERS.search,
      platform: params.get('platform') || DEFAULT_FILTERS.platform,
      difficulty: params.get('difficulty') || DEFAULT_FILTERS.difficulty,
      pattern: params.get('pattern') || DEFAULT_FILTERS.pattern,
      tags: params.getAll('tags'),
    };
  }, [searchParams]);

  // Combine filters with local sort for child components
  const filtersWithSort: Filters = useMemo(
    () => ({
      ...filters,
      sort,
    }),
    [filters, sort]
  );

  // Update URL when filters change (debounced search is handled inside SearchBar)
  const updateFilters = (key: keyof Filters, value: any) => {
    // Do NOT update URL for sort – it's local only
    if (key === 'sort') {
      setSort(value);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (key === 'tags') {
      params.delete('tags');
      (value as string[]).forEach((tag) => params.append('tags', tag));
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
    setSort('newest'); // reset local sort
  };

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  // Build params for useQuestions (exclude sort)
  const queryParams = useMemo(() => {
    const params: any = { page, limit };
    if (filters.search) params.search = filters.search;
    if (filters.platform) params.platform = filters.platform;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.pattern) params.pattern = filters.pattern;
    if (filters.tags.length) params.tags = filters.tags;
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

  // Client‑side sorting based on local sort state
  const sortedQuestions = useMemo(() => {
    if (!questions.length) return [];
    const sorted = [...questions];
    switch (sort) {
      case 'newest':
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return sorted.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'difficulty': {
        const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 };
        return sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
      }
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [questions, sort]);

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
            <a href="/questions/create">Create New</a>
          </Button>
        </div>
      </div>
      <Divider />
      {/* Desktop layout with sidebar */}
      {isDesktop ? (
        <div className={styles.desktopLayout}>
          <QuestionFilterSidebar
            filters={filtersWithSort}
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
            <QuestionList questions={sortedQuestions} isLoading={questionsLoading} />
            {pagination && pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
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
                value={sort}
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
          <QuestionList questions={sortedQuestions} isLoading={questionsLoading} />
          {pagination && pagination.pages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
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
            filters={filtersWithSort}
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
