import apiClient, { buildQueryString } from '@/shared/lib/apiClient';

export interface OverdueRevisionsResponse {
  revisions: any[];
  pagination: any;
}

export const revisionService = {
  /**
   * Get overdue revisions (or today's pending revisions).
   * We'll count the total number of pending/overdue items.
   */
  async getOverdueRevisionsCount(): Promise<number> {
    // Use the /overdue endpoint with a small limit just to get total count
    const query = buildQueryString({ page: 1, limit: 1 });
    const response = await apiClient.get<OverdueRevisionsResponse>(
      `/revisions/overdue${query}`
    );
    // total count is in meta.pagination.total
    return response.meta?.pagination?.total ?? 0;
  },

  /**
   * Alternative: get today's pending revisions and count them.
   * We'll use the above for simplicity.
   */
};