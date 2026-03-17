import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { QuestionsPageClient } from '@/features/question/components/QuestionsPageClient';
import { ROUTES } from '@/shared/config/routes';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Questions · DevRhythm',
  description: 'Browse and filter coding problems from various platforms.',
};

const breadcrumbItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Questions' },
];

export default function QuestionsPage() {
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
      <Suspense fallback={<div>Loading questions...</div>}>
        <QuestionsPageClient />
      </Suspense>
    </>
  );
}