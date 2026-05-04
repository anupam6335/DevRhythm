// frontend/src/app/(main)/users/page.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from '@/shared/config/seo';
import CommunityPage from '@/app/(main)/user/parts/community/CommunityPage';

export const metadata: Metadata = {
  title: `Community · ${SITE_NAME}`,
  description: `Discover and connect with fellow coders. See who's solving problems, track progress, and find your rhythm.`,
  keywords: 'coding community, developers, problem solving, coding buddies, programming leaderboard',
  robots: 'index, follow',
  alternates: {
    canonical: `${SITE_URL}/users`,
  },
  openGraph: {
    title: `Community · ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    url: `${SITE_URL}/users`,
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: `${SITE_URL}/images/og-community.png`,
        width: 1200,
        height: 630,
        alt: 'DevRhythm Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Community · ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/images/og-community.png`],
  },
};

// Generate BreadcrumbList schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Community',
      item: `${SITE_URL}/users`,
    },
  ],
};

// Generate WebPage schema with potentialAction (search)
const webpageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: `Community · ${SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  url: `${SITE_URL}/users`,
  isPartOf: {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/users?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  mainEntity: {
    '@type': 'CollectionPage',
    name: 'Developer Community',
    description: 'Browse and connect with developers solving coding problems.',
  },
};

export default function UsersPage() {
  return (
    <>
      {/* BreadcrumbList Schema */}
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* WebPage Schema */}
      <Script
        id="schema-webpage"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />
      <CommunityPage />
    </>
  );
}