const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';
const COOKIE_NAME = 'auth_token'; // must match the cookie name used in AuthCallbackHandler

export const tokenStorage = {
  setTokens: (token: string, refreshToken: string, userId: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_ID_KEY, userId);
    
    // Set cookie for server‑side access (middleware, server components)
    const secure = window.location.protocol === 'https:';
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=strict${secure ? '; secure' : ''}`;
  },
  
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  getUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(USER_ID_KEY);
  },
  
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    
    // Clear cookie with matching attributes (including secure flag)
    const secure = window.location.protocol === 'https:';
    document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict${secure ? '; secure' : ''}`;
  },
};