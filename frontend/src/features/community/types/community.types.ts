/**
 * Types for the Community (Users List) feature.
 * Matches the response of GET /api/v1/users.
 */

// Base user fields (always present)
export interface CommunityUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  totalSolved: number;
  masteryRate: number;      // 0-100
  totalTimeSpent: number;   // minutes
  isOnline: boolean;
}

// Extended fields for authenticated requests
export interface AuthenticatedCommunityUser extends CommunityUser {
  mutualFriends: number;
  iFollow: boolean;
  followsMe: boolean;
}

// Union type – the hook can return either depending on auth
export type CommunityUserResponse = CommunityUser | AuthenticatedCommunityUser;

// Raw user object from API (field names exactly as returned)
export interface RawUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  totalSolved: number;
  masteryRate: number;
  totalTimeSpent: number;
  isOnline: boolean;
  mutualFriends?: number;
  iFollow?: boolean;
  followsMe?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersApiResponse {
  users: RawUser[];
  pagination: PaginationMeta;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;   // comma‑separated
  sortOrder?: string; // comma‑separated
}

// Props for the UserCard component
export interface UserCardProps {
  user: RawUser;
  isAuthenticated: boolean;
}