'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useDebounceValue } from '@/shared/hooks/useDebounce';
import { questionService } from '@/features/question/services/questionService';
import { toast } from '@/shared/components/Toast';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input/Input';
import TextArea from '@/shared/components/TextArea';
import Loader from '@/shared/components/Loader';
import styles from './page.module.css';

const platforms = ['LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'GeeksForGeeks', 'Other'] as const;
const difficulties = ['Easy', 'Medium', 'Hard'] as const;

const questionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  problemLink: z.string().url('Must be a valid URL'),
  platform: z.enum(platforms),
  platformQuestionId: z.string().min(1, 'Platform question ID is required'),
  difficulty: z.enum(difficulties),
  tags: z.string().optional(),
  pattern: z.string().optional(),
  solutionLinks: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface LeetCodeSearchResult {
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  url: string;
}

interface SearchResponse {
  results: LeetCodeSearchResult[];
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'tag'>('name');
  const [fetching, setFetching] = useState(false);

  const debouncedQuery = useDebounceValue(searchQuery, 500);

  // React Query for search results – caches automatically
  const {
    data: searchResponse,
    isLoading: searching,
    error: searchError,
  } = useQuery<SearchResponse>({
    queryKey: ['leetcode-search', debouncedQuery, searchType],
    queryFn: () => questionService.searchLeetCodeQuestions(debouncedQuery, searchType),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes – data considered fresh
    gcTime: 10 * 60 * 1000,   // 10 minutes cache (formerly cacheTime)
  });

  const searchResults = searchResponse?.results;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      platform: 'LeetCode',
      tags: '',
      solutionLinks: '',
    },
  });

  const handleSelectResult = async (result: LeetCodeSearchResult) => {
    setFetching(true);
    try {
      const data = await questionService.fetchLeetCodeQuestion(result.url);
      setValue('title', data.title);
      setValue('problemLink', data.link);
      setValue('difficulty', data.difficulty as any);
      setValue('tags', data.tags.join(', '));
      setValue('platformQuestionId', result.slug);
      setStep('form');
      toast.success('Problem fetched – complete the remaining details');
    } catch (error: any) {
      toast.error(error.message || 'Could not fetch problem details. Please enter manually.');
      setValue('problemLink', result.url);
      setStep('form');
    } finally {
      setFetching(false);
    }
  };

  const handleManualEntry = () => {
    setStep('form');
  };

  const onSubmit = async (data: QuestionFormData) => {
    try {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        solutionLinks: data.solutionLinks ? data.solutionLinks.split(',').map(l => l.trim()).filter(Boolean) : [],
      };
      await questionService.createQuestion(payload);
      toast.success('Question created successfully');
      router.push('/questions');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create question');
    }
  };

  // Step 1: Search
  if (step === 'search') {
    return (
      <div className="devRhythmContainer" style={{ maxWidth: 600, margin: '2rem auto' }}>
        <h1>Create a New Question</h1>
        <p>Search for a LeetCode problem by name or pattern, or skip to enter manually.</p>

        {/* Search type toggle */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value="name"
              checked={searchType === 'name'}
              onChange={() => setSearchType('name')}
            />
            Search by name
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              value="tag"
              checked={searchType === 'tag'}
              onChange={() => setSearchType('tag')}
            />
            Search by pattern/tag
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Input
            placeholder={searchType === 'name' ? "e.g., three sum" : "e.g., binary search"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            disabled={fetching}
          />
          {searching && (
            <div style={{ marginTop: '0.5rem' }}>
              <Loader size="sm" /> Searching...
            </div>
          )}
          {searchError && (
            <p className={styles.error}>Search failed. Please try again.</p>
          )}
          {!searching && searchResults && searchResults.length > 0 && (
            <ul className={styles.resultList}>
              {searchResults.map((result) => (
                <li
                  key={result.slug}
                  className={styles.resultItem}
                  onClick={() => handleSelectResult(result)}
                >
                  <span className={styles.resultTitle}>{result.title}</span>
                  <span className={styles.resultDifficulty}>{result.difficulty}</span>
                  <span className={styles.resultTags}>{result.tags.join(', ')}</span>
                </li>
              ))}
            </ul>
          )}
          {!searching && debouncedQuery && searchResults?.length === 0 && (
            <p className={styles.noResults}>No problems found. Try a different query.</p>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Button variant="ghost" onClick={handleManualEntry}>
            Skip – enter manually
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Full form (unchanged)
  return (
    <div className="devRhythmContainer" style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h1>Create a New Question</h1>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Title */}
        <div>
          <label htmlFor="title" className={styles.label}>Title</label>
          <Input
            id="title"
            {...register('title')}
            error={!!errors.title}
            fullWidth
          />
          {errors.title && <span className={styles.error}>{errors.title.message}</span>}
        </div>

        {/* Problem Link */}
        <div>
          <label htmlFor="problemLink" className={styles.label}>Problem Link</label>
          <Input
            id="problemLink"
            {...register('problemLink')}
            error={!!errors.problemLink}
            fullWidth
          />
          {errors.problemLink && <span className={styles.error}>{errors.problemLink.message}</span>}
        </div>

        {/* Platform & Difficulty row */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="platform" className={styles.label}>Platform</label>
            <select id="platform" {...register('platform')} className={styles.select}>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {errors.platform && <span className={styles.error}>{errors.platform.message}</span>}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="difficulty" className={styles.label}>Difficulty</label>
            <select id="difficulty" {...register('difficulty')} className={styles.select}>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.difficulty && <span className={styles.error}>{errors.difficulty.message}</span>}
          </div>
        </div>

        {/* Platform Question ID */}
        <div>
          <label htmlFor="platformQuestionId" className={styles.label}>Platform Question ID</label>
          <Input
            id="platformQuestionId"
            {...register('platformQuestionId')}
            error={!!errors.platformQuestionId}
            fullWidth
          />
          {errors.platformQuestionId && <span className={styles.error}>{errors.platformQuestionId.message}</span>}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className={styles.label}>Tags (comma separated)</label>
          <Input
            id="tags"
            {...register('tags')}
            error={!!errors.tags}
            fullWidth
          />
          {errors.tags && <span className={styles.error}>{errors.tags.message}</span>}
        </div>

        {/* Pattern */}
        <div>
          <label htmlFor="pattern" className={styles.label}>Pattern (optional)</label>
          <Input
            id="pattern"
            {...register('pattern')}
            error={!!errors.pattern}
            fullWidth
          />
          {errors.pattern && <span className={styles.error}>{errors.pattern.message}</span>}
        </div>

        {/* Solution Links */}
        <div>
          <TextArea
            label="Solution Links (comma separated)"
            {...register('solutionLinks')}
            error={errors.solutionLinks?.message}
            rows={2}
            autoResize
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="outline" onClick={() => setStep('search')}>
            Back to Search
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader size="sm" /> : 'Create Question'}
          </Button>
        </div>
      </form>
    </div>
  );
}