import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { StudyGroup } from '../types/studyGroup.types';
import type { GroupListResponse, GroupStats } from '../types/studyGroup.types';

export const studyGroupService = {
  /**
   * Get public groups with optional filters (discover page).
   */
  async getGroups(params?: {
    page?: number;
    limit?: number;
    privacy?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<GroupListResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<GroupListResponse>(`/study-groups${query}`);
    return response.data;
  },

  /**
   * Create a new study group.
   */
  async createGroup(data: { name: string; description?: string; privacy?: string }): Promise<StudyGroup> {
    const response = await apiClient.post<{ group: StudyGroup }>('/study-groups', data);
    return response.data.group;
  },

  /**
   * Get groups the current user is a member of (own profile).
   */
  async getMyGroups(params?: { page?: number; limit?: number }): Promise<GroupListResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<GroupListResponse>(`/study-groups/my${query}`);
    return response.data;
  },

  /**
   * Get a single study group by ID.
   */
  async getGroup(groupId: string): Promise<StudyGroup> {
    const response = await apiClient.get<{ group: StudyGroup }>(`/study-groups/${groupId}`);
    return response.data.group;
  },

  /**
   * Update a study group (admin only).
   */
  async updateGroup(groupId: string, data: { name?: string; description?: string; privacy?: string }): Promise<StudyGroup> {
    const response = await apiClient.put<{ group: StudyGroup }>(`/study-groups/${groupId}`, data);
    return response.data.group;
  },

  /**
   * Delete a study group (admin only).
   */
  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/study-groups/${groupId}`);
  },

  /**
   * Join a public or invite‑only group.
   */
  async joinGroup(groupId: string): Promise<any> {
    const response = await apiClient.post<{ membership: any }>(`/study-groups/${groupId}/join`);
    return response.data.membership;
  },

  /**
   * Leave a group.
   */
  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(`/study-groups/${groupId}/leave`);
  },

  /**
   * Remove a member from a group (admin only).
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/study-groups/${groupId}/members/${userId}`);
  },

  /**
   * Create a goal in a group.
   */
  async createGoal(groupId: string, data: { description: string; targetCount: number; deadline: string }): Promise<any> {
    const response = await apiClient.post<{ goal: any }>(`/study-groups/${groupId}/goals`, data);
    return response.data.goal;
  },

  /**
   * Join a group goal.
   */
  async joinGoal(groupId: string, goalId: string): Promise<any> {
    const response = await apiClient.post<{ goal: any }>(`/study-groups/${groupId}/goals/${goalId}/join`);
    return response.data.goal;
  },

  /**
   * Update progress on a goal.
   */
  async updateGoalProgress(groupId: string, goalId: string, progress: number): Promise<any> {
    const response = await apiClient.post<{ goal: any }>(`/study-groups/${groupId}/goals/${goalId}/progress`, { progress });
    return response.data.goal;
  },

  /**
   * Create a challenge in a group.
   */
  async createChallenge(groupId: string, data: any): Promise<any> {
    const response = await apiClient.post<{ challenge: any }>(`/study-groups/${groupId}/challenges`, data);
    return response.data.challenge;
  },

  /**
   * Join a group challenge.
   */
  async joinChallenge(groupId: string, challengeId: string): Promise<any> {
    const response = await apiClient.post<{ challenge: any }>(`/study-groups/${groupId}/challenges/${challengeId}/join`);
    return response.data.challenge;
  },

  /**
   * Update progress on a challenge.
   */
  async updateChallengeProgress(groupId: string, challengeId: string, progress: number): Promise<any> {
    const response = await apiClient.post<{ challenge: any }>(`/study-groups/${groupId}/challenges/${challengeId}/progress`, { progress });
    return response.data.challenge;
  },

  /**
   * Get activity feed for a group.
   */
  async getGroupActivity(groupId: string, limit?: number): Promise<{ activities: any[]; lastActivityAt: string }> {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ activities: any[]; lastActivityAt: string }>(`/study-groups/${groupId}/activity${query}`);
    return response.data;
  },

  /**
   * Get statistics for a group.
   */
  async getGroupStats(groupId: string): Promise<GroupStats> {
    const response = await apiClient.get<{ stats: GroupStats }>(`/study-groups/${groupId}/stats`);
    return response.data.stats;
  },

  /**
   * Get public groups that a user is a member of (for public profile).
   */
  async getUserPublicGroups(
    userId: string,
    params?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<GroupListResponse> {
    const query = buildQueryString(params);
    const response = await apiClient.get<GroupListResponse>(`/users/${userId}/groups${query}`);
    return response.data;
  },
};