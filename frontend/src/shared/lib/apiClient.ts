import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

/**
 * Returns the base URL from environment variables.
 */
const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is not defined');
  }
  return baseUrl;
};

/**
 * Retrieves the authentication token from localStorage.
 * This can be replaced with a more sophisticated token manager later.
 */
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null; // server-side
  return localStorage.getItem('auth_token');
};

/**
 * Builds a query string from an object.
 * Example: { page: 1, limit: 20 } => '?page=1&limit=20'
 */
export const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Axios instance with base configuration.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor: adds authentication token if available.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * - Checks for `success: false` in the response data and throws an error.
 * - On success, unwraps the `data` field and returns `{ data, meta }`.
 * - Handles network errors and other HTTP errors.
 */
apiClient.interceptors.response.use(
  (response) => {
    const apiResponse = response.data as ApiResponse;
    if (apiResponse.success === false) {
      // Construct an error similar to an Axios error with the response data
      const error = new Error(apiResponse.message || 'Request failed');
      (error as any).response = response;
      (error as any).isApiError = true;
      throw error;
    }
    // Return unwrapped data and meta
    return {
      data: apiResponse.data,
      meta: apiResponse.meta,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config,
    };
  },
  (error: AxiosError) => {
    // Enhance error with more context if needed
    if (error.response) {
      const apiError = error.response.data as ApiResponse;
      error.message = apiError?.message || error.message;
    }
    return Promise.reject(error);
  }
);

export default apiClient;