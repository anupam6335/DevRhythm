import apiClient, { buildQueryString, ApiClientResponse } from '@/shared/lib/apiClient';
import type { User } from '@/shared/types';

export const userService = {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/users/me');
    return response.data.user;
  },

  async updateUser(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ user: User }>('/users/me', data);
    return response.data.user;
  },

  async getUserByUsername(username: string): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`/users/${username}`);
    return response.data.user;
  },

  async getUserStats(): Promise<any> {
    const response = await apiClient.get('/users/me/stats');
    return response.data;
  },

  async updateLastOnline(): Promise<{ lastOnline: string }> {
    const response = await apiClient.put('/users/me/last-online');
    return response.data;
  },

  async deleteCurrentUser(): Promise<void> {
    await apiClient.delete('/users/me');
  },

  async searchUsers(q: string, page?: number, limit?: number): Promise<{ users: User[]; pagination: any }> {
    const params = { q, page, limit };
    const query = buildQueryString(params);
    const response = await apiClient.get<{ users: User[] }>(`/users/search${query}`) as ApiClientResponse<{ users: User[] }>;
    return {
      users: response.data.users,
      pagination: response.meta?.pagination || null,
    };
  },

  async getTopStreaks(page?: number, limit?: number): Promise<{ users: User[]; pagination: any }> {
    const params = { page, limit };
    const query = buildQueryString(params);
    const response = await apiClient.get<{ users: User[] }>(`/users/top/streaks${query}`) as ApiClientResponse<{ users: User[] }>;
    return {
      users: response.data.users,
      pagination: response.meta?.pagination || null,
    };
  },

  async getTopSolved(page?: number, limit?: number): Promise<{ users: User[]; pagination: any }> {
    const params = { page, limit };
    const query = buildQueryString(params);
    const response = await apiClient.get<{ users: User[] }>(`/users/top/solved${query}`) as ApiClientResponse<{ users: User[] }>;
    return {
      users: response.data.users,
      pagination: response.meta?.pagination || null,
    };
  },

  async checkUsernameAvailability(username: string): Promise<{ available: boolean; username: string }> {
    const response = await apiClient.get(`/users/${username}/availability`);
    return response.data;
  }
};