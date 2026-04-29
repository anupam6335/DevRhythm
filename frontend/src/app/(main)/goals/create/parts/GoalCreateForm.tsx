'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiSearch, FiPlus, FiX, FiEdit3 } from 'react-icons/fi';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import DatePicker from '@/shared/components/DatePicker';
import { useQuestionSearch } from '@/features/question';
import { useDebounceValue } from '@/shared/hooks';
import { goalService } from '@/features/goal';
import { toast } from '@/shared/components/Toast';
import { queryClient } from '@/shared/lib/react-query'; // <-- ADDED for cache invalidation
import styles from './GoalCreateForm.module.css';

const STORAGE_QUESTIONS_KEY = 'goal_create_selected_questions';
const STORAGE_PLANNED_KEY = 'goal_create_planned_data';

// ========== UTC Date Helpers ==========
function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function getNextWeekEndUTC(): Date {
  const end = getTodayUTC();
  end.setUTCDate(end.getUTCDate() + 7);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function getLocalEndOfDayUTC(date: Date): Date {
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function getDateRangeFromQuickTimeframe(timeframe: string, today: Date) {
  const start = getTodayUTC();
  let end = new Date(start);
  if (timeframe === 'today') {
    end = getLocalEndOfDayUTC(start);
  } else if (timeframe === 'tomorrow') {
    start.setUTCDate(start.getUTCDate() + 1);
    end = getLocalEndOfDayUTC(start);
  } else if (timeframe === 'nextWeek') {
    end.setUTCDate(end.getUTCDate() + 7);
    end.setUTCHours(23, 59, 59, 999);
  } else if (timeframe === 'withinMonth') {
    end.setUTCDate(end.getUTCDate() + 30);
    end.setUTCHours(23, 59, 59, 999);
  }
  return { startDate: start, endDate: end };
}

// ========== Zod Schemas ==========
const dailySchema = z.object({
  goalType: z.literal('daily'),
  targetCount: z.number().int().min(1).max(100),
  date: z.date(),
});

const weeklySchema = z.object({
  goalType: z.literal('weekly'),
  targetCount: z.number().int().min(1).max(100),
  startDate: z.date(),
  endDate: z.date(),
});

const plannedSchema = z.object({
  goalType: z.literal('planned'),
  questionIds: z.array(z.string()).min(1, 'Select at least one question'),
  timeframeType: z.enum(['quick', 'custom']).default('quick'),
  quickTimeframe: z.enum(['today', 'tomorrow', 'nextWeek', 'withinMonth']).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type DailyValues = z.infer<typeof dailySchema>;
type WeeklyValues = z.infer<typeof weeklySchema>;
type PlannedValues = z.infer<typeof plannedSchema>;
type FormValues = DailyValues | WeeklyValues | PlannedValues;

export default function GoalCreateForm() {
  const router = useRouter();
  const [questionSearch, setQuestionSearch] = useState('');
  const debouncedSearch = useDebounceValue(questionSearch, 300);
  const { data: searchResults, isLoading: searchLoading } = useQuestionSearch(debouncedSearch);
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [conflictingQuestionIds, setConflictingQuestionIds] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(z.union([dailySchema, weeklySchema, plannedSchema])),
    defaultValues: {
      goalType: 'daily',
      targetCount: 3,
      date: getTodayUTC(),
      startDate: getTodayUTC(),
      endDate: getNextWeekEndUTC(),
      questionIds: [],
      timeframeType: 'quick',
      quickTimeframe: 'nextWeek',
    } as any,
    mode: 'onChange',
  });

  const goalType = watch('goalType');
  const timeframeType = (watch as any)('timeframeType') as 'quick' | 'custom' | undefined;
  const quickTimeframe = (watch as any)('quickTimeframe') as
    | 'today'
    | 'tomorrow'
    | 'nextWeek'
    | 'withinMonth'
    | undefined;
  const plannedStartDate = (watch as any)('startDate') as Date | undefined;
  const plannedEndDate = (watch as any)('endDate') as Date | undefined;
  const weeklyStart = (watch as any)('startDate') as Date | undefined;
  const isPlanned = goalType === 'planned';
  const isDaily = goalType === 'daily';
  const isWeekly = goalType === 'weekly';

  const plannedTargetCount = useMemo(() => selectedQuestions.length, [selectedQuestions]);
  const todayUTC = getTodayUTC();

  // Helper: scroll to first element with error class
  const scrollToFirstError = () => {
    const firstErrorField = document.querySelector('[class*="error"]');
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper: show user-friendly toast based on current errors
  const showValidationErrors = () => {
    const err = errors as any;
    if (isPlanned && err.questionIds) {
      toast.error(err.questionIds.message);
      return;
    }
    if (!isPlanned && err.targetCount) {
      toast.error(err.targetCount.message);
      return;
    }
    if (isDaily && err.date) {
      toast.error('Please select a date for your daily goal');
      return;
    }
    if (isWeekly) {
      if (err.startDate) {
        toast.error('Please select a start date for your weekly goal');
        return;
      }
      if (err.endDate) {
        toast.error('Please select an end date for your weekly goal');
        return;
      }
    }
    if (isPlanned && plannedTargetCount === 0) {
      toast.error('Please add at least one question to your planned goal');
      return;
    }
    toast.error('Please fill in all required fields correctly');
  };

  // Persistence (unchanged)
  useEffect(() => {
    const storedQuestions = localStorage.getItem(STORAGE_QUESTIONS_KEY);
    if (storedQuestions) {
      try {
        const parsed = JSON.parse(storedQuestions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedQuestions(parsed);
          setValue(
            'questionIds',
            parsed.map((q: any) => q._id)
          );
        }
      } catch {}
    }
    const storedPlanned = localStorage.getItem(STORAGE_PLANNED_KEY);
    if (storedPlanned) {
      try {
        const parsed = JSON.parse(storedPlanned);
        if (parsed.goalType === 'planned') {
          setValue('goalType', 'planned');
          setValue('timeframeType', parsed.timeframeType || 'quick');
          if (parsed.quickTimeframe) setValue('quickTimeframe', parsed.quickTimeframe);
          if (parsed.startDate) setValue('startDate', new Date(parsed.startDate));
          if (parsed.endDate) setValue('endDate', new Date(parsed.endDate));
        }
      } catch {}
    }
    setTimeout(() => trigger(), 100);
  }, [setValue, trigger]);

  useEffect(() => {
    if (selectedQuestions.length > 0) {
      localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(selectedQuestions));
    } else {
      localStorage.removeItem(STORAGE_QUESTIONS_KEY);
    }
  }, [selectedQuestions]);

  useEffect(() => {
    if (isPlanned) {
      const toStore: any = { goalType: 'planned' };
      if (timeframeType) toStore.timeframeType = timeframeType;
      if (quickTimeframe) toStore.quickTimeframe = quickTimeframe;
      if (plannedStartDate instanceof Date) toStore.startDate = plannedStartDate.toISOString();
      if (plannedEndDate instanceof Date) toStore.endDate = plannedEndDate.toISOString();
      localStorage.setItem(STORAGE_PLANNED_KEY, JSON.stringify(toStore));
    } else {
      localStorage.removeItem(STORAGE_PLANNED_KEY);
    }
  }, [isPlanned, timeframeType, quickTimeframe, plannedStartDate, plannedEndDate]);

  useEffect(() => {
    if (isPlanned && timeframeType === 'custom') {
      if (!plannedStartDate) setValue('startDate', getTodayUTC());
      if (!plannedEndDate) setValue('endDate', getNextWeekEndUTC());
    }
  }, [isPlanned, timeframeType, plannedStartDate, plannedEndDate, setValue]);

  const handleGoalTypeChange = (type: 'daily' | 'weekly' | 'planned') => {
    setValue('goalType', type);
    if (type === 'daily') {
      setValue('targetCount', 3);
      setValue('date', getTodayUTC());
    } else if (type === 'weekly') {
      setValue('targetCount', 15);
      setValue('startDate', getTodayUTC());
      setValue('endDate', getNextWeekEndUTC());
    }
    trigger();
  };

  const handleQuickTimeframeChange = (tf: 'today' | 'tomorrow' | 'nextWeek' | 'withinMonth') => {
    setValue('quickTimeframe', tf);
    if (isPlanned && timeframeType === 'quick') {
      const { startDate, endDate } = getDateRangeFromQuickTimeframe(tf, new Date());
      setValue('startDate', startDate);
      setValue('endDate', endDate);
    }
    trigger();
  };

  const addQuestion = (question: any) => {
    if (!selectedQuestions.some((q) => q._id === question._id)) {
      const newSelected = [...selectedQuestions, question];
      setSelectedQuestions(newSelected);
      setValue(
        'questionIds',
        newSelected.map((q) => q._id)
      );
      setConflictingQuestionIds([]);
      trigger('questionIds');
    }
    setQuestionSearch('');
  };

  const removeQuestion = (questionId: string) => {
    const newSelected = selectedQuestions.filter((q) => q._id !== questionId);
    setSelectedQuestions(newSelected);
    setValue(
      'questionIds',
      newSelected.map((q) => q._id)
    );
    setConflictingQuestionIds([]);
    trigger('questionIds');
  };

  const removeAllConflicting = () => {
    const newSelected = selectedQuestions.filter((q) => !conflictingQuestionIds.includes(q._id));
    setSelectedQuestions(newSelected);
    setValue(
      'questionIds',
      newSelected.map((q) => q._id)
    );
    setConflictingQuestionIds([]);
    trigger('questionIds');
  };

  // ========== SUBMIT LOGIC ==========
  const onSubmit = async (data: FormValues) => {
    try {
      if (data.goalType === 'planned') {
        let startDate: Date, endDate: Date;
        if (data.timeframeType === 'quick' && data.quickTimeframe) {
          const range = getDateRangeFromQuickTimeframe(data.quickTimeframe, new Date());
          startDate = range.startDate;
          endDate = range.endDate;
        } else {
          if (!data.startDate || !data.endDate) {
            toast.error('Please select both start and end dates');
            return;
          }
          startDate = data.startDate;
          endDate = data.endDate;
        }
        const startUTC = new Date(
          Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0)
        );
        const endUTC = new Date(
          Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
        );
        const payload = {
          questionIds: data.questionIds,
          startDate: startUTC.toISOString(),
          endDate: endUTC.toISOString(),
        };
        await goalService.createPlannedGoal(payload);
      } else if (data.goalType === 'daily') {
        const startUTC = new Date(
          Date.UTC(data.date.getFullYear(), data.date.getMonth(), data.date.getDate(), 0, 0, 0)
        );
        const endUTC = new Date(
          Date.UTC(
            data.date.getFullYear(),
            data.date.getMonth(),
            data.date.getDate(),
            23,
            59,
            59,
            999
          )
        );
        const payload = {
          goalType: 'daily' as const,
          targetCount: data.targetCount,
          startDate: startUTC.toISOString(),
          endDate: endUTC.toISOString(),
        };
        await goalService.createGoal(payload);
      } else {
        const startUTC = new Date(
          Date.UTC(
            data.startDate.getFullYear(),
            data.startDate.getMonth(),
            data.startDate.getDate(),
            0,
            0,
            0
          )
        );
        const endUTC = new Date(
          Date.UTC(
            data.endDate.getFullYear(),
            data.endDate.getMonth(),
            data.endDate.getDate(),
            23,
            59,
            59,
            999
          )
        );
        const payload = {
          goalType: 'weekly' as const,
          targetCount: data.targetCount,
          startDate: startUTC.toISOString(),
          endDate: endUTC.toISOString(),
        };
        await goalService.createGoal(payload);
      }

      toast.success('Goal created successfully!');
      // Invalidate React Query caches so the goals page shows fresh data
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals', 'planned'] });
      queryClient.invalidateQueries({ queryKey: ['revisions', 'detailed'] });

      localStorage.removeItem(STORAGE_QUESTIONS_KEY);
      localStorage.removeItem(STORAGE_PLANNED_KEY);
      setSelectedQuestions([]);
      setConflictingQuestionIds([]);
      reset();
      window.dispatchEvent(new CustomEvent('goalCreated'));
      setTimeout(() => {
        router.push('/goals');
      }, 100);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create goal';
      toast.error(message);
      const match = message.match(/Question\(s\)\s+([0-9a-f]+(?:\s*,\s*[0-9a-f]+)*)/i);
      if (match) {
        const ids = match[1].split(',').map((id) => id.trim());
        setConflictingQuestionIds(ids);
      } else {
        setConflictingQuestionIds([]);
      }
    }
  };

  const onError = () => {
    showValidationErrors();
    scrollToFirstError();
  };

  const errorsAny = errors as any;

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className={styles.form}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create Goal</h1>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/goals')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Create Goal
          </Button>
        </div>
      </div>

      <div className={styles.columns}>
        {/* Left panel – Goal Type & Question Search */}
        <div className={styles.leftPanel}>
          <div className={styles.sourceCard}>
            <h2 className={styles.panelTitle}>Goal Settings</h2>

            <div className={styles.sourceSection}>
              <div className={styles.sourceLabel}>Goal Type</div>
              <div className={styles.typeButtons}>
                {(['daily', 'weekly', 'planned'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.typeButton} ${goalType === type ? styles.active : ''}`}
                    onClick={() => handleGoalTypeChange(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {isPlanned && (
              <>
                <div className={styles.sourceSection}>
                  <div className={styles.sourceLabel}>Add Questions</div>
                  <div className={styles.searchWrapper}>
                    <Input
                      leftIcon={<FiSearch />}
                      placeholder="Search problems..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      size="md"
                      fullWidth
                    />
                    {debouncedSearch.length >= 2 && (
                      <div className={styles.searchResults}>
                        {searchLoading && <div className={styles.searchLoading}>Searching...</div>}
                        {searchResults?.questions?.length === 0 && !searchLoading && (
                          <div className={styles.noResults}>No questions found</div>
                        )}
                        {searchResults?.questions?.map((q: any) => (
                          <div
                            key={q._id}
                            className={styles.searchResultItem}
                            onClick={() => addQuestion(q)}
                          >
                            <span>
                              {q.title} ({q.difficulty})
                            </span>
                            <FiPlus />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.sourceSection}>
                  <div className={styles.sourceLabel}>
                    Selected: {selectedQuestions.length} question
                    {selectedQuestions.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right panel – Details (scrollable) */}
        <div className={styles.rightPanel}>
          <div className={styles.detailsScroll}>
            <section className={styles.detailsSection}>
              <h2 className={styles.sectionTitle}>
                <FiEdit3 className={styles.sectionIcon} /> Basic Information
              </h2>

              <div className={styles.field}>
                <label className={styles.label}>Target Count *</label>
                {!isPlanned && (
                  <Controller
                    name="targetCount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        error={!!errorsAny.targetCount}
                        fullWidth
                        className={styles.input}
                      />
                    )}
                  />
                )}
                {isPlanned && (
                  <Input value={plannedTargetCount} disabled fullWidth className={styles.input} />
                )}
                {errorsAny.targetCount && (
                  <p className={styles.error}>{errorsAny.targetCount.message}</p>
                )}
              </div>

              {isDaily && (
                <div className={styles.field}>
                  <label className={styles.label}>Date *</label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                        size="md"
                        fullWidth
                        minDate={todayUTC}
                      />
                    )}
                  />
                  {errorsAny.date && <p className={styles.error}>{errorsAny.date.message}</p>}
                </div>
              )}

              {isWeekly && (
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Week start *</label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Start date"
                          size="md"
                          fullWidth
                          minDate={todayUTC}
                        />
                      )}
                    />
                    {errorsAny.startDate && (
                      <p className={styles.error}>{errorsAny.startDate.message}</p>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Week end *</label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="End date"
                          size="md"
                          fullWidth
                          minDate={weeklyStart}
                        />
                      )}
                    />
                    {errorsAny.endDate && (
                      <p className={styles.error}>{errorsAny.endDate.message}</p>
                    )}
                  </div>
                </div>
              )}

              {isPlanned && timeframeType === 'custom' && (
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Start Date</label>
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                          size="md"
                          fullWidth
                          minDate={todayUTC}
                        />
                      )}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>End Date</label>
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          placeholder="Select end date"
                          size="md"
                          fullWidth
                          minDate={plannedStartDate}
                        />
                      )}
                    />
                  </div>
                </div>
              )}
            </section>

            {isPlanned && (
              <div className={styles.detailsSection}>
                <div className={styles.timeframeSelector}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="timeframeType"
                      value="quick"
                      checked={timeframeType === 'quick'}
                      onChange={() => setValue('timeframeType', 'quick')}
                    />
                    Use timeframe
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="timeframeType"
                      value="custom"
                      checked={timeframeType === 'custom'}
                      onChange={() => setValue('timeframeType', 'custom')}
                    />
                    Custom dates
                  </label>
                </div>
                {timeframeType === 'quick' && (
                  <div className={styles.quickSelect}>
                    <select
                      value={quickTimeframe}
                      onChange={(e) => handleQuickTimeframeChange(e.target.value as any)}
                      className={styles.select}
                    >
                      <option value="today">Today</option>
                      <option value="tomorrow">Tomorrow</option>
                      <option value="nextWeek">Next week</option>
                      <option value="withinMonth">Within a month</option>
                    </select>
                    <small className={styles.helpText}>
                      {quickTimeframe === 'today' && 'Goal will be set for today only.'}
                      {quickTimeframe === 'tomorrow' && 'Goal will start tomorrow.'}
                      {quickTimeframe === 'nextWeek' && 'Goal will span the next 7 days.'}
                      {quickTimeframe === 'withinMonth' && 'Goal will end within the next 30 days.'}
                    </small>
                  </div>
                )}
              </div>
            )}

            {isPlanned && (
              <section className={styles.detailsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <FiEdit3 className={styles.sectionIcon} /> Selected Questions
                  </h2>
                  {conflictingQuestionIds.length > 0 && (
                    <button
                      type="button"
                      className={styles.removeAllConflictsBtn}
                      onClick={removeAllConflicting}
                    >
                      Remove all conflicting
                    </button>
                  )}
                </div>
                {errorsAny.questionIds && (
                  <div className={styles.questionErrorBanner}>{errorsAny.questionIds.message}</div>
                )}
                <div className={styles.riverList}>
                  {selectedQuestions.length === 0 ? (
                    <div className={styles.noQuestionsMessage}>No questions added yet.</div>
                  ) : (
                    selectedQuestions.map((q) => {
                      const isConflicting = conflictingQuestionIds.includes(q._id);
                      return (
                        <div
                          key={q._id}
                          className={`${styles.riverItem} ${isConflicting ? styles.conflictingItem : ''}`}
                        >
                          <div className={styles.node} />
                          <div className={styles.riverContent}>
                            <div className={styles.riverHeader}>
                              <span className={styles.connector}>╰─</span>
                              <span className={styles.riverTitle}>{q.title}</span>
                              <span className={styles.riverDifficulty}>{q.difficulty}</span>
                              {isConflicting && (
                                <span
                                  className={styles.conflictBadge}
                                  title="Conflicts with an existing goal"
                                >
                                  ⚠️ Conflict
                                </span>
                              )}
                              <button
                                type="button"
                                className={styles.removeRiverBtn}
                                onClick={() => removeQuestion(q._id)}
                              >
                                Remove
                              </button>
                            </div>
                            {q.tags && q.tags.length > 0 && (
                              <div className={styles.riverTags}>
                                {q.tags.slice(0, 3).map((tag: string) => (
                                  <span key={tag} className={styles.tag}>
                                    #{tag}
                                  </span>
                                ))}
                                {q.tags.length > 3 && (
                                  <span className={styles.tag}>+{q.tags.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
