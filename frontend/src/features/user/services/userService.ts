import apiClient from '@/shared/lib/apiClient';
import type { User } from '@/shared/types';

export const userService = {
  /**
   * Get the currently authenticated user.
   * GET /users/me
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/users/me');
    return response.data.user;
  },

  /**
   * Update the current user's profile.
   * PUT /users/me
   */
  async updateUser(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ user: User }>('/users/me', data);
    return response.data.user;
  },

  /**
   * Get public user profile by username.
   * GET /users/:username
   */
  async getUserByUsername(username: string): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`/users/${username}`);
    return response.data.user;
  },

  /**
   * Get user statistics.
   * GET /users/me/stats
   */
  async getUserStats(): Promise<any> {
    const response = await apiClient.get('/users/me/stats');
    return response.data;
  },
};