
import type { Metadata } from 'next';
import { userService } from '@/features/user/services/userService';
import { UserPageWrapper } from '@/features/user/components';
import { SITE_NAME, SITE_URL } from '@/shared/config/seo';
import NotFoundPage from '@/shared/components/NotFoundPage';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try {
    const user = await userService.getUserByUsername(username);
    const title = `${user.displayName} (@${user.username}) · ${SITE_NAME}`;
    const description = `Solved ${user.stats.totalSolved} problems · ${user.streak.current} day streak · ${user.stats.masteryRate}% mastery.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/user/${username}`,
        siteName: SITE_NAME,
        images: user.avatarUrl ? [{ url: user.avatarUrl }] : undefined,
        type: 'profile',
        ...(user.username && {
          profile: {
            username: user.username,
          },
        }),
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: user.avatarUrl ? [user.avatarUrl] : undefined,
      },
    };
  } catch (error) {
    console.error(`Metadata fetch failed for ${username}:`, error);
    return {
      title: 'User Not Found',
      description: 'The requested user profile does not exist or is private.',
    };
  }
}

export default async function PublicUserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  try {
    const user = await userService.getUserByUsername(username);
    return <UserPageWrapper user={user} isOwnProfile={false} />;
  } catch (error) {
    console.error(`Failed to fetch user ${username}:`, error);
    return (
      <NotFoundPage
        title="User Not Found"
        message="The user you're looking for doesn't exist or their profile is private."
        actionHref="/"
        actionText="Go back home"
      />
    );
  }
}