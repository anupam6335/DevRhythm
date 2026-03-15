import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/features/auth/server/getCurrentUser';
import { UserPageWrapper } from '@/features/user/components';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL } from '@/shared/config/seo';

// Optional metadata (since it's a private page, you might skip or use generic)
export const metadata: Metadata = {
  title: `My Profile · ${SITE_NAME}`,
  robots: 'noindex, nofollow', // Private page – do not index
};

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