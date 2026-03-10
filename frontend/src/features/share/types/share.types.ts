import type { Share } from '@/shared/types';

export interface ShareListResponse {
  shares: Share[];
  pagination: any;
}

export interface ShareStats {
  totalShares: number;
  activeShares: number;
  expiredShares: number;
  totalAccesses: number;
  byShareType: { profile: number; period: number };
  byPeriodType: { day: number; week: number; month: number; custom: number };
  byPrivacy: { public: number; private: number; 'link-only': number };
  mostAccessed: { shareId: string; accessCount: number; shareType: string } | null;
}