import type { RevisionSchedule } from '@/shared/types';

export interface RevisionListResponse {
  revisions: RevisionSchedule[];
  pagination: any;
}

export interface TodayRevisionsResponse {
  pendingRevisions: Array<{
    _id: string;
    questionId: any;
    scheduledDate: string;
    revisionIndex: number;
    overdue: boolean;
  }>;
  stats: any;
}

export interface UpcomingRevisionsResponse {
  upcomingRevisions: Array<{
    _id: string;
    date: string;
    count: number;
    questions: any[];
  }>;
  stats: any;
}

export interface OverdueRevisionsResponse {
  revisions: RevisionSchedule[];
  pagination: any;
}

export interface RevisionStats {
  totalActive: number;
  totalCompleted: number;
  totalOverdue: number;
  completionRate: number;
}