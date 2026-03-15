import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { Notification } from '@/shared/types';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: any;
}

export const notificationService = {
  /**
   * Get notifications for the authenticated user.
   */
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationsResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<NotificationsResponse>(
      `/notifications${query}`
    );
    return response.data;
  },

  /**
   * Mark a specific notification as read.
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.patch<{ notification: Notification }>(
      `/notifications/${notificationId}/read`
    );
    return response.data.notification;
  },

  /**
   * Mark multiple notifications as read.
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<{ modifiedCount: number }> {
    const response = await apiClient.post<{ modifiedCount: number }>(
      '/notifications/read-multiple',
      { notificationIds }
    );
    return response.data;
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Get only the unread count.
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },
};