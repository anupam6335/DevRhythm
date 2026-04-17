import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { ROUTES } from '@/shared/config/routes';
import PatternDetailsClient from './parts/PatternDetailsClient';
import { slugToPatternName } from '@/shared/lib';


interface PageProps {
  params: Promise<{ patternName: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { patternName: slug } = await params;
  const originalName = slugToPatternName(decodeURIComponent(slug));
  return {
    title: `${originalName} · Pattern Mastery · DevRhythm`,
    description: `Track your progress for the ${originalName} coding pattern. View solved questions, mastery rate, and more.`,
  };
}

export default async function PatternDetailPage({ params }: PageProps) {
  const { patternName: slug } = await params;
  const originalName = slugToPatternName(decodeURIComponent(slug));

  const breadcrumbItems = [
    { label: 'Home', href: ROUTES.HOME },
    { label: 'Patterns', href: '/patterns' },
    { label: originalName },
  ];

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
      <PatternDetailsClient patternName={originalName} />
    </>
  );
}