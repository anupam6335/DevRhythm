import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/features/auth/server/getCurrentUser';
import { UserPageWrapper } from '@/features/user/components';
import { SITE_NAME, SITE_URL } from '@/shared/config/seo';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await getCurrentUser();

  // If authenticated and the URL username matches the logged-in user's username
  if (user && user.username === username) {
    return {
      title: `${user.displayName} (@${user.username}) · My Profile · ${SITE_NAME}`,
      robots: 'noindex, nofollow', // Private page – do not index
      alternates: {
        canonical: `${SITE_URL}/user/u/${username}`,
      },
    };
  }

  // Fallback (will likely be redirected, but just in case)
  return {
    title: `My Profile · ${SITE_NAME}`,
    robots: 'noindex, nofollow',
    alternates: {
      canonical: `${SITE_URL}/user/u/${username}`,
    },
  };
}

export default async function OwnUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getCurrentUser();

  // Not authenticated → redirect to login
  if (!user) {
    redirect('/login');
  }

  // Username mismatch → redirect to correct own profile URL
  if (user.username !== username) {
    redirect(`/user/u/${user.username}`);
  }

  return <UserPageWrapper user={user} isOwnProfile={true} />;
}