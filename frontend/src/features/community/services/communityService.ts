import apiClient, { ApiClientResponse, buildQueryString } from '@/shared/lib/apiClient';
import type { UsersApiResponse, GetUsersParams } from '../types/community.types';

/**
 * Service for fetching the paginated user list from /api/v1/users.
 * Handles both authenticated and unauthenticated requests.
 */
export const communityService = {
  /**
   * Get users with pagination, search, and sorting.
   * @param params - Query parameters (page, limit, search, sortBy, sortOrder)
   * @returns Promise with users array and pagination metadata
   */
  async getUsers(params?: GetUsersParams): Promise<UsersApiResponse> {
    // Build query string from params
    const queryParams: Record<string, any> = {};

    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.search && params.search.trim()) queryParams.search = params.search.trim();
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const query = buildQueryString(queryParams);
    // ApiClient returns ApiClientResponse with `data` and `meta` properties
    const response = await apiClient.get<{ users: any[] }>(`/users${query}`) as ApiClientResponse<{ users: any[] }>;

    return {
      users: response.data.users,
      pagination: response.meta?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: response.data.users.length,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
  },
};