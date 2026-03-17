'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiSearch, FiTag, FiPaperclip, FiLink, FiEdit3 } from 'react-icons/fi';

import { useCreateQuestion } from '../hooks/useCreateQuestion';
import { usePatterns } from '../hooks/usePatterns';
import { useTags } from '../hooks/useTags';
import { ChipInput } from './ChipInput';
import { SolutionLinksInput } from './SolutionLinksInput';
import { LeetCodeSearch } from './LeetCodeSearch';
import { LeetCodeUrlInput } from './LeetCodeUrlInput';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import { prepareCreateQuestionPayload } from '../utils/questionHelpers';
import { ROUTES } from '@/shared/config/routes';
import styles from './CreateQuestionForm.module.css';

const platforms = [
  'LeetCode',
  'Codeforces',
  'HackerRank',
  'AtCoder',
  'CodeChef',
  'GeeksForGeeks',
  'Other',
] as const;
const difficulties = ['Easy', 'Medium', 'Hard'] as const;

const questionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  problemLink: z.string().url('Must be a valid URL'),
  platform: z.enum(platforms),
  platformQuestionId: z.string().min(1, 'Platform question ID is required'),
  difficulty: z.enum(difficulties),
  tags: z.array(z.string()).default([]),
  pattern: z.array(z.string()).default([]),
  solutionLinks: z.array(z.string()).default([]),
  contentRef: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof questionSchema>;

export const CreateQuestionForm: React.FC = () => {
  const router = useRouter();
  const createMutation = useCreateQuestion();

  const { data: patternOptions = [] } = usePatterns();
  const { data: tagOptions = [] } = useTags();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      platform: 'LeetCode',
      tags: [],
      pattern: [],
      solutionLinks: [],
      contentRef: '',
    },
  });

  const [fetchSource, setFetchSource] = useState<'search' | 'url' | null>(null);

  const handleLeetCodeSearchSelect = (result: any) => {
    setValue('title', result.title);
    setValue('problemLink', result.url);
    setValue('difficulty', result.difficulty as any);
    setValue('tags', result.tags);
    setValue('platformQuestionId', result.slug);
    setValue('platform', 'LeetCode');
    setFetchSource('search');
    if (result.tags.length > 0) {
      setValue('pattern', [result.tags[0]]);
    }
  };

  const handleUrlFetch = (data: any) => {
    setValue('title', data.title);
    setValue('problemLink', data.link);
    setValue('difficulty', data.difficulty as any);
    setValue('tags', data.tags);
    setValue('platform', 'LeetCode');
    const match = data.link.match(/\/problems\/([^/]+)/);
    if (match) {
      setValue('platformQuestionId', match[1]);
    }
    setFetchSource('url');
    if (data.tags.length > 0) {
      setValue('pattern', [data.tags[0]]);
    }
  };

  const onSubmit = async (data: FormData) => {
    const payload = prepareCreateQuestionPayload(data);
    const result = await createMutation.mutateAsync(payload);
    router.push(`/questions/${result.platformQuestionId}`);
  };

  const handleCancel = () => {
    router.push(ROUTES.QUESTIONS.ROOT);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Create Question</h1>
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Create
          </Button>
        </div>
      </div>

      {/* Two‑column layout */}
      <div className={styles.columns}>
        {/* Left panel – Source */}
        <div className={styles.leftPanel}>
          <div className={styles.sourceCard}>
            <h2 className={styles.panelTitle}>
              <FiSearch className={styles.panelIcon} /> Source
            </h2>

            <div className={styles.sourceSection}>
              <div className={styles.sourceLabel}>Search LeetCode Problem</div>
              <LeetCodeSearch onSelect={handleLeetCodeSearchSelect} />
            </div>

            <div className={styles.sourceSection}>
              <div className={styles.sourceLabel}> Or paste URL</div>
              <LeetCodeUrlInput onFetch={handleUrlFetch} disabled={isSubmitting} />
              <span className={styles.sourceHint}>Auto‑fetches when valid</span>
            </div>
          </div>
        </div>

        {/* Right panel – Details (with continuous dashed line) */}
        <div className={styles.rightPanel}>
          <div className={styles.detailsScroll}>
            {/* Basic Information */}
            <section className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>
                <FiEdit3 className={styles.sectionIcon} /> Basic Information
              </h2>
              <div className={styles.field}>
                <label htmlFor="title" className={styles.label}>
                  Title <span className={styles.required}>*</span>
                </label>
                <Input
                  id="title"
                  {...register('title')}
                  error={!!errors.title}
                  fullWidth
                  disabled={isSubmitting}
                  className={styles.input}
                />
                {errors.title && <p className={styles.error}>{errors.title.message}</p>}
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="platform" className={styles.label}>
                    Platform <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="platform"
                    {...register('platform')}
                    className={styles.select}
                    disabled={isSubmitting}
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.platform && <p className={styles.error}>{errors.platform.message}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="platformQuestionId" className={styles.label}>
                    ID <span className={styles.required}>*</span>
                  </label>
                  <Input
                    id="platformQuestionId"
                    {...register('platformQuestionId')}
                    error={!!errors.platformQuestionId}
                    fullWidth
                    disabled={isSubmitting}
                    className={styles.input}
                  />
                  {errors.platformQuestionId && (
                    <p className={styles.error}>{errors.platformQuestionId.message}</p>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="problemLink" className={styles.label}>
                  Problem Link <span className={styles.required}>*</span>
                </label>
                <Input
                  id="problemLink"
                  {...register('problemLink')}
                  error={!!errors.problemLink}
                  fullWidth
                  disabled={isSubmitting}
                  className={styles.input}
                />
                {errors.problemLink && <p className={styles.error}>{errors.problemLink.message}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Difficulty <span className={styles.required}>*</span>
                </label>
                <div className={styles.radioGroup}>
                  {difficulties.map((d) => (
                    <label key={d} className={styles.radio}>
                      <input type="radio" value={d} {...register('difficulty')} disabled={isSubmitting} />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
                {errors.difficulty && <p className={styles.error}>{errors.difficulty.message}</p>}
              </div>
            </section>

            {/* Tags & Patterns */}
            <section className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>
                <FiTag className={styles.sectionIcon} /> Tags & Patterns
              </h2>
              <div className={styles.field}>
                <label className={styles.label}>Tags</label>
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <ChipInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Type a tag and press Enter"
                      suggestions={tagOptions}
                      disabled={isSubmitting}
                      className={styles.chipInput}
                    />
                  )}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Patterns</label>
                <Controller
                  name="pattern"
                  control={control}
                  render={({ field }) => (
                    <ChipInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Type a pattern and press Enter"
                      suggestions={patternOptions}
                      disabled={isSubmitting}
                      className={styles.chipInput}
                    />
                  )}
                />
              </div>
            </section>

            {/* Solution Links */}
            <section className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>
                <FiLink className={styles.sectionIcon} /> Solution Links
              </h2>
              <Controller
                name="solutionLinks"
                control={control}
                render={({ field }) => (
                  <SolutionLinksInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    className={styles.solutionLinks}
                  />
                )}
              />
            </section>

            {/* Content Ref */}
            <section className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>
                <FiPaperclip className={styles.sectionIcon} /> Content Ref (optional)
              </h2>
              <Input
                {...register('contentRef')}
                placeholder="https://..."
                fullWidth
                disabled={isSubmitting}
                className={styles.input}
              />
            </section>
          </div>
        </div>
      </div>
    </form>
  );
};