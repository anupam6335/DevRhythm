import { z } from 'zod';
import type { Platform, Difficulty } from '@/shared/types';

// ===== Common primitives =====
export const emailSchema = z.string().email('Invalid email address');
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const idSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// ===== Pagination =====
export const paginationParamsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ===== Date range =====
export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime({ message: 'Invalid start date' }),
    endDate: z.string().datetime({ message: 'Invalid end date' }),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

// ===== Goal validators =====
export const createGoalSchema = z.object({
  goalType: z.enum(['daily', 'weekly']),
  targetCount: z.number().int().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const updateGoalSchema = z.object({
  targetCount: z.number().int().min(1).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ===== Question validators =====
export const createQuestionSchema = z.object({
  title: z.string().min(2).max(200),
  problemLink: z.string().url(),
  platform: z.enum([
    'LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'GeeksForGeeks', 'Other'
  ] as const satisfies readonly Platform[]),
  platformQuestionId: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'] as const satisfies readonly Difficulty[]),
  tags: z.array(z.string()).default([]),
  pattern: z.string().optional(),
  solutionLinks: z.array(z.string().url()).default([]),
  similarQuestions: z.array(idSchema).default([]),
  contentRef: z.string().url().optional().or(z.literal('')),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// ===== Progress validators =====
export const createOrUpdateProgressSchema = z.object({
  status: z.enum(['Not Started', 'Attempted', 'Solved', 'Mastered']).optional(),
  notes: z.string().max(5000).optional(),
  keyInsights: z.string().max(1000).optional(),
  savedCode: z.object({
    language: z.string(),
    code: z.string(),
  }).optional(),
  confidenceLevel: z.number().int().min(1).max(5).optional(),
  timeSpent: z.number().int().min(0).max(480).optional(),
});

// ===== Revision validators =====
export const createRevisionSchema = z.object({
  baseDate: z.string().datetime().optional().default(() => new Date().toISOString()),
  schedule: z.array(z.string().datetime()).length(5).optional(),
});

export const completeRevisionSchema = z.object({
  completedAt: z.string().datetime().optional().default(() => new Date().toISOString()),
  status: z.enum(['completed', 'skipped']).default('completed'),
  confidenceLevel: z.number().int().min(1).max(5).optional(),
});

// ===== Share validators =====
export const createShareSchema = z.object({
  shareType: z.enum(['profile', 'period']),
  periodType: z.enum(['day', 'week', 'month', 'custom']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customPeriodName: z.string().max(100).optional(),
  privacy: z.enum(['public', 'private', 'link-only']).default('link-only'),
  expiresInDays: z.number().int().min(1).max(365).optional().default(30),
  includeQuestions: z.boolean().default(true),
  questionLimit: z.number().int().min(1).max(100).optional().default(50),
}).refine(
  (data) => {
    if (data.shareType === 'period') {
      return data.periodType !== undefined && data.startDate !== undefined && data.endDate !== undefined;
    }
    return true;
  },
  {
    message: 'Period shares require periodType, startDate, and endDate',
    path: ['shareType'],
  }
);

// ===== Study group validators =====
export const createStudyGroupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  privacy: z.enum(['public', 'private', 'invite-only']).default('invite-only'),
});

export const createGroupGoalSchema = z.object({
  description: z.string().min(5).max(500),
  targetCount: z.number().int().min(1),
  deadline: z.string().datetime(),
});

export const createGroupChallengeSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  challengeType: z.enum(['sprint', 'marathon', 'difficulty-focused', 'pattern-focused']),
  target: z.number().int().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// ===== User validators =====
export const updateUserSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  preferences: z.object({
    timezone: z.string().regex(/^UTC[+-]\d{1,2}:\d{2}$/).optional(),
    notifications: z.object({
      revisionReminders: z.boolean().optional(),
      goalTracking: z.boolean().optional(),
      socialInteractions: z.boolean().optional(),
      weeklyReports: z.boolean().optional(),
    }).optional(),
    dailyGoal: z.number().int().min(1).max(50).optional(),
    weeklyGoal: z.number().int().min(5).max(100).optional(),
  }).optional(),
  privacy: z.enum(['public', 'private', 'link-only']).optional(),
});