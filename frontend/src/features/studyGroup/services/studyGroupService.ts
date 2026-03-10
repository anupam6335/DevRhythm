import apiClient, { buildQueryString } from '@/shared/lib/apiClient';
import type { StudyGroup } from '@/shared/types';
import type { GroupListResponse, GroupActivity, GroupStats } from '../types/studyGroup.types';

export const studyGroupService = {
  async getGroups(params?: {
    page?: number;
    limit?: number;
    privacy?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<GroupListResponse>(`/study-groups${query}`);
    return response.data;
  },

  async createGroup(data: { name: string; description?: string; privacy?: string }) {
    const response = await apiClient.post<{ group: StudyGroup }>('/study-groups', data);
    return response.data.group;
  },

  async getMyGroups(params?: { page?: number; limit?: number }) {
    const query = buildQueryString(params);
    const response = await apiClient.get<GroupListResponse>(`/study-groups/my${query}`);
    return response.data;
  },

  async getGroup(groupId: string) {
    const response = await apiClient.get<{ group: StudyGroup }>(`/study-groups/${groupId}`);
    return response.data.group;
  },

  async updateGroup(groupId: string, data: { name?: string; description?: string; privacy?: string }) {
    const response = await apiClient.put<{ group: StudyGroup }>(`/study-groups/${groupId}`, data);
    return response.data.group;
  },

  async deleteGroup(groupId: string) {
    await apiClient.delete(`/study-groups/${groupId}`);
  },

  async joinGroup(groupId: string) {
    const response = await apiClient.post<{ membership: any }>(`/study-groups/${groupId}/join`);
    return response.data.membership;
  },

  async leaveGroup(groupId: string) {
    await apiClient.post(`/study-groups/${groupId}/leave`);
  },

  async removeMember(groupId: string, userId: string) {
    await apiClient.delete(`/study-groups/${groupId}/members/${userId}`);
  },

  async createGoal(groupId: string, data: { description: string; targetCount: number; deadline: string }) {
    const response = await apiClient.post<{ goal: any }>(`/study-groups/${groupId}/goals`, data);
    return response.data.goal;
  },

  async joinGoal(groupId: string, goalId: string) {
    const response = await apiClient.post<{ goal: any }>(`/study-groups/${groupId}/goals/${goalId}/join`);
    return response.data.goal;
  },

  async updateGoalProgress(groupId: string, goalId: string, progress: number) {
    const response = await apiClient.post<{ goal: any }>(`/study-groups/${groupId}/goals/${goalId}/progress`, { progress });
    return response.data.goal;
  },

  async createChallenge(groupId: string, data: any) {
    const response = await apiClient.post<{ challenge: any }>(`/study-groups/${groupId}/challenges`, data);
    return response.data.challenge;
  },

  async joinChallenge(groupId: string, challengeId: string) {
    const response = await apiClient.post<{ challenge: any }>(`/study-groups/${groupId}/challenges/${challengeId}/join`);
    return response.data.challenge;
  },

  async updateChallengeProgress(groupId: string, challengeId: string, progress: number) {
    const response = await apiClient.post<{ challenge: any }>(`/study-groups/${groupId}/challenges/${challengeId}/progress`, { progress });
    return response.data.challenge;
  },

  async getGroupActivity(groupId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<GroupActivity>(`/study-groups/${groupId}/activity${query}`);
    return response.data;
  },

  async getGroupStats(groupId: string) {
    const response = await apiClient.get<{ stats: GroupStats }>(`/study-groups/${groupId}/stats`);
    return response.data.stats;
  }
};