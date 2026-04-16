import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { ROUTES } from '@/shared/config/routes';
import PatternsDashboardClient from './parts/PatternsDashboardClient';
import { PatternDashboardSkeleton } from './parts/PatternDashboardSkeleton';

export const metadata: Metadata = {
  title: 'Pattern Mastery Dashboard · DevRhythm',
  description:
    'Track your progress across coding patterns. View strongest/weakest patterns, mastery rates, and recent solved questions.',
  openGraph: {
    title: 'Pattern Mastery Dashboard · DevRhythm',
    description:
      'Track your progress across coding patterns. View strongest/weakest patterns, mastery rates, and recent solved questions.',
    type: 'website',
  },
  robots: 'index, follow',
  alternates: {
    canonical: '/patterns',
  },
};

const breadcrumbItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Patterns' },
];

export default async function PatternsPage() {
  return (
    <>
      <Breadcrumb
        items={breadcrumbItems}
        renderLink={(item, props) => (
          <Link href={item.href!} className={props.className}>
            {props.children}
          </Link>
        )}
      />
      <Suspense fallback={<PatternDashboardSkeleton />}>
        <PatternsDashboardClient />
      </Suspense>
    </>
  );
}