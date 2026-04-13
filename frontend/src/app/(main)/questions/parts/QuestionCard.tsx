'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { FaCheckCircle } from 'react-icons/fa';
import Card from '@/shared/components/Card';
import PlatformIcon from '@/shared/components/PlatformIcon';
import Tooltip from '@/shared/components/Tooltip';
import type { Question } from '@/shared/types';
import styles from './QuestionCard.module.css';

interface QuestionCardProps {
  question: Question;
}

// Helper to normalize pattern (string or array) to array
const normalizePattern = (pattern: string | string[] | undefined): string[] => {
  if (!pattern) return [];
  if (Array.isArray(pattern)) return pattern;
  return [pattern];
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUpdated = formatDistanceToNow(new Date(question.updatedAt), { addSuffix: true });

  const displayedTags = question.tags.slice(0, 4);
  const remainingTags = question.tags.slice(3);
  const hasMoreTags = remainingTags.length > 0;

  const patterns = normalizePattern(question.pattern);
  const displayedPattern = patterns.length > 0 ? patterns[0] : null;
  const remainingPatterns = patterns.slice(1);

  const handleClick = () => {
    // Store the current list URL (including filters and page) before leaving
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    sessionStorage.setItem('lastQuestionsListUrl', currentUrl);
  };

  return (
    <Link
      href={`/questions/${question.platformQuestionId}`}
      className={styles.cardLink}
      onClick={handleClick}
    >
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>{question.title}</h3>
          <span className={clsx(styles.difficulty, styles[question.difficulty.toLowerCase()])}>
            {question.difficulty}
          </span>
        </div>

        <div className={styles.platform}>
          <PlatformIcon platform={question.platform} size="sm" />
          <span>{question.platform}</span>
        </div>

        <div className={styles.tagsSection}>
          {question.tags.length > 0 && (
            <div className={styles.tagsRow}>
              {displayedTags.map(tag => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
              {hasMoreTags && (
                <Tooltip content={remainingTags.join(', ')}>
                  <span className={styles.tag}>+{remainingTags.length}</span>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        <div className={styles.patternSection}>
          {displayedPattern && (
            <div className={styles.pattern}>
              <span>Pattern: </span>
              <em>{displayedPattern}</em>
              {remainingPatterns.length > 0 && (
                <Tooltip content={remainingPatterns.join(', ')}>
                  <span className={styles.patternMore}> +{remainingPatterns.length}</span>
                </Tooltip>
              )}
            </div>
          )}
        </div>
        {question.isSolved && (
          <div className={styles.solvedBadge}>
            <FaCheckCircle className={styles.solvedIcon} />
          </div>
        )}
      </Card>
    </Link>
  );
};