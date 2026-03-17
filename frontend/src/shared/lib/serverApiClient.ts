// src/shared/lib/serverApiClient.ts
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface FetchOptions extends RequestInit {
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

export async function serverFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
    cache: options.cache ?? 'force-cache',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}