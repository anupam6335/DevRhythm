import apiClient from '@/shared/lib/apiClient';
import type { User } from '@/shared/types';

export const authService = {
  /**
   * Fetch the currently authenticated user.
   * GET /users/me
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/users/me');
    return response.data.user;
  },

  /**
   * Log out the current user.
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};