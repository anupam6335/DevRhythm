import type { Metadata } from 'next';
import Script from 'next/script';
import { userService } from '@/features/user/services/userService';
import { heatmapService } from '@/features/heatmap/services/heatmapService';
import { studyGroupService } from '@/features/studyGroup/services/studyGroupService';
import { patternMasteryService } from '@/features/patternMastery/services/patternMasteryService';
import { userStatsService } from '@/features/user/services/userStatsService';
import { UserPageWrapper } from '@/features/user/components';
import { SITE_NAME, SITE_URL } from '@/shared/config/seo';
import NotFoundPage from '@/shared/components/NotFoundPage';
import type { GroupListResponse } from '@/features/studyGroup/types/studyGroup.types';
import type { PatternMasteryListResponse } from '@/features/patternMastery/types/patternMastery.types';

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
    // 1. Fetch user first (needed for userId)
    const user = await userService.getUserByUsername(username);
    const userId = user._id;
    const currentYear = new Date().getFullYear();

    // 2. Fetch all other public data in parallel
    const [
      heatmapResult,
      progressResult,
      groupsResult,
      patternsResult,
      statsResult,
    ] = await Promise.allSettled([
      heatmapService.getPublicUserHeatmap(userId, currentYear, { simple: true }),
      userService.getUserPublicProgress(userId, { limit: 6 }),
      studyGroupService.getUserPublicGroups(userId, { limit: 5 }),
      patternMasteryService.getUserPatternMastery(userId, { limit: 4 }),
      userStatsService.getPublicUserStats(userId),
    ]);

    // 3. Extract data with proper typing and fallbacks
    const initialHeatmap = heatmapResult.status === 'fulfilled' ? heatmapResult.value : null;
    const initialProgress = progressResult.status === 'fulfilled' ? progressResult.value : [];
    const initialGroups = groupsResult.status === 'fulfilled' ? groupsResult.value as GroupListResponse : null;
    const initialPatterns = patternsResult.status === 'fulfilled' ? (patternsResult.value as PatternMasteryListResponse).patterns : [];
    const initialDetailedStats = statsResult.status === 'fulfilled' ? statsResult.value : null;

    // 4. Generate structured data (JSON-LD)
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: user.displayName,
      alternateName: `@${user.username}`,
      description: `Solved ${user.stats.totalSolved} coding problems with a ${user.streak.current} day streak and ${user.stats.masteryRate}% mastery rate.`,
      image: user.avatarUrl || undefined,
      url: `${SITE_URL}/user/${username}`,
      sameAs: [], 
      mainEntityOfPage: {
        '@type': 'ProfilePage',
        '@id': `${SITE_URL}/user/${username}`,
      },
    };

    return (
      <>
        {/* Structured data */}
        <Script
          id="schema-person"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <UserPageWrapper
          user={user}
          isOwnProfile={false}
          initialHeatmap={initialHeatmap}
          initialProgress={initialProgress}
          initialGroups={initialGroups}
          initialPatterns={initialPatterns}
          initialDetailedStats={initialDetailedStats}
        />
      </>
    );
  } catch (error) {
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