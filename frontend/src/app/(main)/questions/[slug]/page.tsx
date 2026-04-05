import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { questionServiceServer } from '@/features/question/services/questionService.server';
import { QuestionDetailPageClient } from './parts/QuestionDetailPageClient';
import NotFoundPage from '@/shared/components/NotFoundPage';
import { ROUTES } from '@/shared/config/routes';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const question = await questionServiceServer.getQuestionBySlug(slug);
    return {
      title: `${question.title} · DevRhythm`,
      description: `Solve ${question.title} on ${question.platform}. ${question.difficulty} · ${question.tags.join(', ')}`,
    };
  } catch (error) {
    return {
      title: 'Question Not Found',
      description: 'The requested question could not be found.',
    };
  }
}

const breadcrumbItems = (questionTitle: string) => [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Questions', href: ROUTES.QUESTIONS.ROOT },
  { label: questionTitle },
];

export default async function QuestionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  try {
    const question = await questionServiceServer.getQuestionBySlug(slug);
    const similarQuestions = await questionServiceServer.getSimilarQuestions(question._id);

    return (
      <>
        <Breadcrumb
          items={breadcrumbItems(question.title)}
          renderLink={(item, props) => (
            <Link href={item.href!} className={props.className}>
              {props.children}
            </Link>
          )}
        />
        <Suspense fallback={<div>Loading question...</div>}>
          <QuestionDetailPageClient
            initialQuestion={question}
            initialSimilarQuestions={similarQuestions}
          />
        </Suspense>
      </>
    );
  } catch (error) {
    // Question not found
    return (
      <NotFoundPage
        title="Question Not Found"
        message="The question you're looking for doesn't exist or may have been removed."
        actions={[
          { text: 'Create Question', href: '/questions/create', variant: 'primary' },
          { text: 'Browse All Questions', href: '/questions', variant: 'outline' }
        ]}
      />
    );
  }
}