import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getCurrentUser } from '@/features/auth/server/getCurrentUser';
import { UserPageWrapper } from '@/features/user/components';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { SITE_NAME, SITE_URL } from '@/shared/config/seo';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await getCurrentUser();

  if (user && user.username === username) {
    return {
      title: `${user.displayName} · My Profile · ${SITE_NAME}`,
      robots: 'noindex, nofollow',
      alternates: {
        canonical: `${SITE_URL}/user/u/${username}`,
      },
    };
  }

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

  if (!user) {
    redirect('/login');
  }

  if (user.username !== username) {
    redirect(`/user/u/${user.username}`);
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Users', href: '/users' },
    { label: 'My Profile' },
  ];

  return (
    <>
      <Breadcrumb items={breadcrumbItems} />
      <UserPageWrapper user={user} isOwnProfile={true} />
    </>
  );
}