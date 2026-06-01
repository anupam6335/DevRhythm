'use client';

import Link from 'next/link';
import { FiCheckCircle, FiRefreshCw, FiUsers } from 'react-icons/fi';
import clsx from 'clsx';
import Badge from '@/shared/components/Badge';
import Tooltip from '@/shared/components/Tooltip';
import type { SheetQuestion, TagGroup, UserProgressDetail } from '@/features/sheets';
import styles from './QuestionGroupList.module.css';

interface QuestionGroupListProps {
  groups: TagGroup[];
  perQuestionParticipantCounts: Record<string, number>;
  perQuestionSolvedCounts: Record<string, number>;
  userProgressDetails?: UserProgressDetail[];
  isJoined: boolean;
}

export default function QuestionGroupList({
  groups,
  perQuestionParticipantCounts,
  perQuestionSolvedCounts,
  userProgressDetails,
  isJoined,
}: QuestionGroupListProps) {
  const progressMap = new Map<string, { solved: boolean; revisionCompleted: boolean }>();
  if (userProgressDetails) {
    userProgressDetails.forEach(p => {
      progressMap.set(p.questionId.toString(), {
        solved: p.solved,
        revisionCompleted: p.revisionCompleted,
      });
    });
  }

  return (
    <div className={styles.container}>
      {groups.map((group, idx) => (
        <div key={idx} className={styles.group}>
          <div className={styles.groupHeader}>
            <div className={styles.tagsWrapper}>
              {group.tags.map(tag => (
                <Badge key={tag} variant="default" size="sm" className={styles.tagBadge}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className={styles.questionsList}>
            {group.questions.map((question: SheetQuestion) => {
              const progress = progressMap.get(question._id.toString());
              const isSolved = progress?.solved || false;
              const isRevisionCompleted = progress?.revisionCompleted || false;
              const participantCount = perQuestionParticipantCounts[question._id.toString()] || 0;
              const solvedCount = perQuestionSolvedCounts[question._id.toString()] || 0;

              return (
                <div key={question._id} className={styles.questionItem}>
                  <div className={styles.questionNode}>
                    <div className={clsx(styles.nodeDot, isSolved && styles.nodeSolved)} />
                  </div>
                  <div className={styles.questionContent}>
                    <div className={styles.questionHeader}>
                      <Link
                        href={`/questions/${question.platformQuestionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.questionTitle}
                      >
                        {question.title}
                      </Link>
                      <div className={styles.questionMeta}>
                        <Badge
                          variant={question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}
                          size="sm"
                        >
                          {question.difficulty}
                        </Badge>
                        <span className={styles.platform}>{question.platform}</span>
                      </div>
                    </div>
                    {question.tags && question.tags.length > 0 && (
                      <div className={styles.questionTags}>
                        {question.tags.slice(0, 3).map(tag => (
                          <span key={tag} className={styles.tag}>#{tag}</span>
                        ))}
                        {question.tags.length > 3 && (
                          <Tooltip content={question.tags.slice(3).join(', ')}>
                            <span className={styles.tag}>+{question.tags.length - 3}</span>
                          </Tooltip>
                        )}
                      </div>
                    )}
                    <div className={styles.statusRow}>
                      {isJoined ? (
                        <>
                          <div className={styles.statusIcon}>
                            {isSolved ? (
                              <FiCheckCircle className={styles.solvedIcon} />
                            ) : (
                              <span className={styles.notSolved}>❌ Not solved</span>
                            )}
                          </div>
                          <div className={styles.statusIcon}>
                            {isRevisionCompleted ? (
                              <FiRefreshCw className={styles.revisionIcon} />
                            ) : (
                              <span className={styles.notRevised}>🔄 Revision pending</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className={styles.loginPrompt}>
                          <span>Join this sheet to track your progress</span>
                        </div>
                      )}
                      <div className={styles.participantStats}>
                        <FiUsers className={styles.usersIcon} />
                        <span>{solvedCount} / {participantCount} participants solved</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}