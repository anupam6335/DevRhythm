'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FiSearch, FiTag, FiPaperclip, FiLink, FiEdit3, FiPlus, FiTrash2,
} from 'react-icons/fi';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import { ROUTES } from '@/shared/config/routes';
import styles from './CreateQuestionForm.module.css';
import {
  prepareCreateQuestionPayload,
  useCreateQuestion,
  usePatterns,
  useTags,
} from '@/features/question';
import { LeetCodeSearch } from './LeetCodeSearch';
import { LeetCodeUrlInput } from './LeetCodeUrlInput';
import { ChipInput } from './ChipInput';
import { SolutionLinksInput } from './SolutionLinksInput';

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

const testCaseSchema = z.object({
  stdin: z.string().optional(),
  expected: z.string().min(1, 'Expected output is required'),
});

const questionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  problemLink: z.string().url('Must be a valid URL'),
  platform: z.enum(platforms),
  platformQuestionId: z.string().min(1, 'Platform question ID is required'),
  difficulty: z.enum(difficulties),
  tags: z.array(z.string()).default([]),
  pattern: z.array(z.string()).default([]),
  solutionLinks: z.array(z.string()).default([]),
  contentRef: z.string().optional(),
  testCases: z.array(testCaseSchema).default([]),
});

type FormData = z.infer<typeof questionSchema>;

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      platform: 'LeetCode',
      tags: [],
      pattern: [],
      solutionLinks: [],
      contentRef: '',
      testCases: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'testCases',
  });

  const [autoGenerateId, setAutoGenerateId] = useState(true);
  const [fetchSource, setFetchSource] = useState<'search' | 'url' | null>(null);
  const title = watch('title');

  // Auto‑generate platformQuestionId when title changes
  useEffect(() => {
    if (autoGenerateId && title) {
      const slug = generateSlug(title);
      setValue('platformQuestionId', slug);
    }
  }, [title, autoGenerateId, setValue]);

  const handleLeetCodeSearchSelect = (result: any) => {
    setValue('title', result.title);
    setValue('problemLink', result.url);
    setValue('difficulty', result.difficulty as any);
    setValue('tags', result.tags);
    setValue('platformQuestionId', result.slug);
    setValue('platform', 'LeetCode');
    setAutoGenerateId(false);
    setFetchSource('search');
    if (result.tags.length > 0) {
      setValue('pattern', [result.tags[0]]);
    }
    if (result.description) {
      setValue('contentRef', result.description);
    }
    setValue('testCases', []);
  };

  const handleUrlFetch = useCallback(
    (data: any) => {
      setValue('title', data.title);
      setValue('problemLink', data.link);
      setValue('difficulty', data.difficulty as any);
      setValue('tags', data.tags);
      setValue('platform', 'LeetCode');
      const match = data.link.match(/\/problems\/([^/]+)/);
      if (match) {
        setValue('platformQuestionId', match[1]);
      }
      setAutoGenerateId(false);
      setFetchSource('url');
      if (data.tags.length > 0) {
        setValue('pattern', [data.tags[0]]);
      }
      if (data.description) {
        setValue('contentRef', data.description);
      }
      setValue('testCases', []);
    },
    [setValue]
  );

  // Generate HTML examples from test cases and append to contentRef
  const appendExamplesToContent = useCallback((currentContent: string, testCases: FormData['testCases']) => {
    if (testCases.length === 0) return currentContent;
    let examplesHtml = '';
    testCases.forEach((tc, idx) => {
      const inputDisplay = tc.stdin?.replace(/\\n/g, '\n') || '';
      examplesHtml += `
        <p><strong class="example">Example ${idx + 1}:</strong></p>
        <pre>
<strong>Input:</strong> ${inputDisplay}
<strong>Output:</strong> ${tc.expected}
        </pre>
      `;
    });
    // Avoid duplication: check if content already contains these examples? (optional)
    return currentContent + examplesHtml;
  }, []);

  const onSubmit = async (data: FormData) => {
    const isManual = fetchSource === null;
    let finalContentRef = data.contentRef || '';

    if (isManual && data.testCases.length > 0) {
      finalContentRef = appendExamplesToContent(finalContentRef, data.testCases);
    }

    const payload = prepareCreateQuestionPayload({
      ...data,
      contentRef: finalContentRef,
    });

    const submitData = {
      ...payload,
      isManual,
      testCases: isManual ? data.testCases : undefined,
    };

    const result = await createMutation.mutateAsync(submitData);
    router.push(`/questions/${result.platformQuestionId}`);
  };

  const handleCancel = () => {
    router.push(ROUTES.QUESTIONS.ROOT);
  };

  const isDescriptionReadOnly = fetchSource !== null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create Question</h1>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Create
          </Button>
        </div>
      </div>

      <div className={styles.columns}>
        {/* Left panel – Source */}
        <div className={styles.leftPanel}>
          <div className={styles.sourceCard}>
            <h2 className={styles.panelTitle}>
              Find Question From Leetcode
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

        {/* Right panel – Details */}
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
                    ID
                  </label>
                  <Input
                    id="platformQuestionId"
                    {...register('platformQuestionId')}
                    error={!!errors.platformQuestionId}
                    fullWidth
                    disabled={isSubmitting}
                    readOnly
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
                      <input
                        type="radio"
                        value={d}
                        {...register('difficulty')}
                        disabled={isSubmitting}
                      />
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

            {/* Test Cases (only for manual questions) */}
            {fetchSource === null && (
              <section className={styles.detailsSection}>
                <h2 className={styles.sectionTitle}>
                  <FiPaperclip className={styles.sectionIcon} /> Test Cases
                </h2>
                <div className={styles.testCasesList}>
                  {fields.map((field, index) => (
                    <div key={field.id} className={styles.testCaseRow}>
                      <div className={styles.testCaseField}>
                        <label>Input (stdin)</label>
                        <input
                          type="text"
                          {...register(`testCases.${index}.stdin`)}
                          placeholder="Use \n for newline, e.g., 2 3 6 7\n7"
                          className={styles.testCaseInput}
                        />
                        <small className={styles.inputHint}>
                          Use \n to separate multiple lines of input
                        </small>
                      </div>
                      <div className={styles.testCaseField}>
                        <label>Expected Output</label>
                        <input
                          type="text"
                          {...register(`testCases.${index}.expected`)}
                          placeholder="e.g., [[2,2,3],[7]]"
                          className={styles.testCaseInput}
                        />
                        {errors.testCases?.[index]?.expected && (
                          <p className={styles.error}>
                            {errors.testCases[index]?.expected?.message}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className={styles.removeTestCase}
                        aria-label="Remove test case"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => append({ stdin: '', expected: '' })}
                    className={styles.addTestCase}
                  >
                    <FiPlus /> Add test case
                  </button>
                </div>
              </section>
            )}

            {/* Problem Description */}
            <section className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>
                <FiPaperclip className={styles.sectionIcon} /> Problem Description
              </h2>
              <Input
                {...register('contentRef')}
                placeholder={
                  isDescriptionReadOnly
                    ? 'Auto-filled from LeetCode'
                    : 'Add Problem Description (HTML allowed)'
                }
                fullWidth
                disabled={isSubmitting}
                readOnly={isDescriptionReadOnly}
                className={styles.input}
              />
              {isDescriptionReadOnly && (
                <p className={styles.hint} style={{ marginTop: '0.25rem', color: 'var(--accent-moss)' }}>
                  Description fetched from LeetCode (read‑only)
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </form>
  );
};