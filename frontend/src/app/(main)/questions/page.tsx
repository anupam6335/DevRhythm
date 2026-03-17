// app/(main)/questions/page.tsx
import { QuestionsPageClient } from '@/features/question/components/QuestionsPageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questions · DevRhythm',
  description: 'Browse and filter coding problems from various platforms.',
};

export default function QuestionsPage() {
  return <QuestionsPageClient />;
}