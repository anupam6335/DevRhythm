'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import Card from '@/shared/components/Card';
import PlatformIcon from '@/shared/components/PlatformIcon';
import Tooltip from '@/shared/components/Tooltip';
import { slugify } from '@/shared/lib/stringUtils';
import type { Question } from '@/shared/types';
import styles from './QuestionCard.module.css';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const lastUpdated = formatDistanceToNow(new Date(question.updatedAt), { addSuffix: true });
  const slug = slugify(question.title);

  // Tags handling
  const displayedTags = question.tags.slice(0, 3);
  const remainingTags = question.tags.slice(3);
  const hasMoreTags = remainingTags.length > 0;

  // Pattern handling
  const displayedPattern = question.pattern && question.pattern.length > 0 ? question.pattern[0] : null;
  const remainingPatterns = question.pattern && question.pattern.length > 1 ? question.pattern.slice(1) : [];

  return (
    <Link href={`/questions/${slug}`} className={styles.cardLink}>
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

        {/* Tags section – always takes fixed height */}
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

        {/* Pattern section – always takes fixed height */}
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

        <div className={styles.footer}>
          <span className={styles.lastUpdated}>{lastUpdated}</span>
        </div>
      </Card>
    </Link>
  );
};