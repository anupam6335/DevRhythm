import Link from 'next/link';
import { FiHelpCircle } from 'react-icons/fi';
import PlatformIcon from '@/shared/components/PlatformIcon';
import Card from '@/shared/components/Card';
import NoRecordFound from '@/shared/components/NoRecordFound';
import type { Question } from '@/shared/types';
import styles from './SuggestedQuestionsList.module.css';

interface SuggestedQuestionsListProps {
  questions: Question[];
  patternName: string;
}

export default function SuggestedQuestionsList({ questions, patternName }: SuggestedQuestionsListProps) {
  const viewAllUrl = `/questions?pattern=${encodeURIComponent(patternName)}&status=Not Started,Attempted`;

  if (!questions.length) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Suggested Questions</h3>
          <Link href={viewAllUrl} className={styles.viewAll}>
            View all unsolved →
          </Link>
        </div>
        <NoRecordFound
          message="No unsolved questions available for this pattern. Check back later or explore other patterns."
          icon={<FiHelpCircle size={48} />}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Suggested Questions</h3>
        <Link href={viewAllUrl} className={styles.viewAll}>
          View all unsolved →
        </Link>
      </div>
      <div className={styles.list}>
        {questions.map((q) => (
          <Link key={q._id} href={`/questions/${q.platformQuestionId}`} className={styles.cardLink}>
            <Card className={styles.suggestedCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{q.title}</span>
                <span className={`${styles.difficultyBadge} ${styles[q.difficulty.toLowerCase()]}`}>
                  {q.difficulty}
                </span>
              </div>
              <div className={styles.cardMeta}>
                <PlatformIcon platform={q.platform} size="sm" />
                <span>{q.platform}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}