import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { Follow, FollowStats, FollowStatus, FollowSuggestion, MutualFollow } from '../types/follow.types';

export const followService = {
  async getFollowing(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<{ following: Follow[] }>(`/follow/following${query}`);
    return response.data;
  },

  async getFollowers(params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<{ followers: Follow[] }>(`/follow/followers${query}`);
    return response.data;
  },

  async followUser(userId: string) {
    const response = await apiClient.post<{ follow: Follow; counts: { followingCount: number; followersCount: number } }>(`/follow/${userId}`);
    return response.data;
  },

  async unfollowUser(userId: string) {
    const response = await apiClient.delete<{ follow: Follow; counts: { followingCount: number; followersCount: number } }>(`/follow/${userId}`);
    return response.data;
  },

  async getFollowStatus(targetUserId: string) {
    const response = await apiClient.get<{ followStatus: FollowStatus }>(`/follow/${targetUserId}/status`);
    return response.data.followStatus;
  },

  async getSuggestions(limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ suggestions: FollowSuggestion[] }>(`/follow/suggestions${query}`);
    return response.data.suggestions;
  },

  async getMutualFollows(targetUserId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ mutualFollows: MutualFollow[]; count: number }>(`/follow/mutual/${targetUserId}${query}`);
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get<{ stats: FollowStats }>('/follow/stats');
    return response.data.stats;
  },

  async getPublicFollowing(userId: string, params?: { page?: number; limit?: number }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<{ following: any[]; user: any }>(`/users/${userId}/following${query}`);
    return response.data;
  },

  async getPublicFollowers(userId: string, params?: { page?: number; limit?: number }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<{ followers: any[]; user: any }>(`/users/${userId}/followers${query}`);
    return response.data;
  },
};