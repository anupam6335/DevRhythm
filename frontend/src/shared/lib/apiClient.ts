import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types';

// ========== Configuration ==========
const REFRESH_BEFORE_EXPIRY_SECONDS = 30; // Refresh 30 seconds before token expires

const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is not defined');
  }
  return baseUrl;
};

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

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

export interface ApiClientResponse<T = any> {
  data: T;
  meta: Record<string, any>;
  status: number;
  statusText: string;
  headers: any;
  config: InternalAxiosRequestConfig;
}

export function isPaginatedResponse<T>(
  response: ApiClientResponse<T>
): response is ApiClientResponse<T> & {
  meta: { pagination: NonNullable<PaginatedResponse<T>['meta']['pagination']> };
} {
  return !!response.meta?.pagination;
}

// ========== JWT Decode Helper ==========
const decodeJWT = (token: string): { exp?: number } | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    return JSON.parse(payloadJson);
  } catch (e) {
    console.warn('Failed to decode JWT', e);
    return null;
  }
};

// ========== Proactive Refresh Timer ==========
let refreshTimer: NodeJS.Timeout | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];
let isRedirecting = false;

const scheduleProactiveRefresh = (token: string) => {
  if (refreshTimer) clearTimeout(refreshTimer);
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return;
  const expiresAt = decoded.exp * 1000; // seconds to ms
  const now = Date.now();
  const timeUntilExpiry = expiresAt - now;
  const refreshAt = timeUntilExpiry - REFRESH_BEFORE_EXPIRY_SECONDS * 1000;
  if (refreshAt <= 0) {
    // Already too close – refresh immediately
    performRefresh().catch(console.error);
    return;
  }
  refreshTimer = setTimeout(() => {
    performRefresh().catch(console.error);
  }, refreshAt);
};

const performRefresh = async () => {
  if (isRefreshing) return;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return;

  isRefreshing = true;
  try {
    const refreshResponse = await axios.post(
      `${getBaseUrl()}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
    // Update stored tokens
    localStorage.setItem('auth_token', newAccessToken);
    localStorage.setItem('refresh_token', newRefreshToken);
    const secure = window.location.protocol === 'https:';
    document.cookie = `auth_token=${newAccessToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict${
      secure ? '; secure' : ''
    }`;
    // Schedule next proactive refresh
    scheduleProactiveRefresh(newAccessToken);
    // Resolve queued requests
    processQueue(null, newAccessToken);
  } catch (error) {
    processQueue(error as Error, null);
    clearTokensAndRedirect();
  } finally {
    isRefreshing = false;
  }
};

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearTokensAndRedirect = () => {
  if (isRedirecting) return;
  isRedirecting = true;
  if (typeof window === 'undefined') return;

  const isLoginPage = window.location.pathname === '/login';
  const isCallbackPage = window.location.pathname === '/auth/callback';

  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');

  const secure = window.location.protocol === 'https:';
  document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict${
    secure ? '; secure' : ''
  }`;

  if (isLoginPage || isCallbackPage) {
    isRedirecting = false;
    return;
  }

  const returnTo = window.location.pathname + window.location.search + window.location.hash;
  if (!returnTo.startsWith('/login')) {
    localStorage.setItem('returnTo', returnTo);
  }
  window.location.href = '/login';
};

// ========== Axios Instance ==========
const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== Request Interceptor ==========
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// ========== Response Interceptor ==========
apiClient.interceptors.response.use(
  response => {
    const apiResponse = response.data as ApiResponse;
    if (apiResponse.success === false) {
      const error = new Error(apiResponse.message || 'Request failed');
      (error as any).response = response;
      (error as any).isApiError = true;
      throw error;
    }
    return {
      data: apiResponse.data,
      meta: apiResponse.meta,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config,
    } as ApiClientResponse;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Guards for login/callback and auth endpoints
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname === '/login' || pathname === '/auth/callback') {
        return Promise.reject(error);
      }
    }
    const url = originalRequest?.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/exchange')) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      clearTokensAndRedirect();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    isRefreshing = true;
    try {
      const refreshResponse = await axios.post(
        `${getBaseUrl()}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

      localStorage.setItem('auth_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);

      const secure = window.location.protocol === 'https:';
      document.cookie = `auth_token=${newAccessToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict${
        secure ? '; secure' : ''
      }`;

      // Schedule next proactive refresh
      scheduleProactiveRefresh(newAccessToken);

      processQueue(null, newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);
      clearTokensAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ========== Listen for token changes and schedule refresh ==========
// Whenever a new token is stored (e.g., after login or refresh), schedule proactive refresh
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
  originalSetItem.apply(this, [key, value]);
  if (key === 'auth_token' && value) {
    scheduleProactiveRefresh(value);
  }
};

// Also handle visibility change: when tab becomes visible again, check token and refresh if needed
const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    const token = getToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.exp) {
        const timeUntilExpiry = decoded.exp * 1000 - Date.now();
        if (timeUntilExpiry <= REFRESH_BEFORE_EXPIRY_SECONDS * 1000) {
          performRefresh().catch(console.error);
        } else {
          // Re‑schedule based on current token
          scheduleProactiveRefresh(token);
        }
      }
    }
  }
};
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', onVisibilityChange);
}

// Initial schedule if token already exists
const initialToken = getToken();
if (initialToken) scheduleProactiveRefresh(initialToken);

export default apiClient;