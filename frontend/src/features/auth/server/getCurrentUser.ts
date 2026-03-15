import { cookies } from 'next/headers';
import type { User } from '@/shared/types';

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies(); // Note: cookies() returns a promise in Next.js 15
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 }, // Do not cache – always fresh
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data.data.user as User;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}