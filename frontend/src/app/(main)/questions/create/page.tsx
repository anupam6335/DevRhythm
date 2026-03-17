import { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumb from '@/shared/components/Breadcrumb';
import { CreateQuestionForm } from '@/features/question/components/CreateQuestionForm';
import { ROUTES } from '@/shared/config/routes';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Create Question · DevRhythm',
  description: 'Add a new coding problem to the database.',
};

const breadcrumbItems = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Questions', href: ROUTES.QUESTIONS.ROOT },
  { label: 'Create Question' },
];

export default function CreateQuestionPage() {
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
      <CreateQuestionForm />
    </>
  );
}