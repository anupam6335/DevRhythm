import { Suspense } from 'react';
import Script from 'next/script';
import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, OG_IMAGE } from '@/shared/config/seo';
import LoginPageWrapper from '@/features/auth/components/LoginPageWrapper';


export const metadata: Metadata = {
  title: `Login - ${SITE_NAME}`,
  description: `Join ${SITE_NAME} to track your coding problems, build streaks, and grow with a community of developers.`,
  openGraph: {
    title: `Login - ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    url: `${SITE_URL}/login`,
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} – Find your coding rhythm`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `Login - ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
};

export default function LoginPage() {
  return (
    <>
      {/* Structured data for the website */}
      <Script
        id="schema-org"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
            description: DEFAULT_DESCRIPTION,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      <Suspense fallback={<div className="devRhythmContainer" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>}>
        <LoginPageWrapper />
      </Suspense>
    </>
  );
}