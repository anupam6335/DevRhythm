'use client';

import Link from 'next/link';
import { FiUsers } from 'react-icons/fi';
import { Avatar } from '@/shared/components/Avatar';
import { ROUTES } from '@/shared/config';
import type { Participant } from '@/features/sheets';
import styles from './ParticipantList.module.css';

interface ParticipantListProps {
  participants: Participant[];
  sheetSlug: string;
}

export default function ParticipantList({ participants, sheetSlug }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FiUsers className={styles.emptyIcon} />
        <p>No participants yet. Be the first to join!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {participants.map((participant) => (
          <Link
            key={participant.userId}
            href={ROUTES.SHEETS.PROGRESS(sheetSlug, participant.username)}
            className={styles.participantCard}
          >
            <Avatar
              src={participant.avatarUrl}
              name={participant.displayName || participant.username}
              size="md"
              className={styles.avatar}
            />
            <div className={styles.participantInfo}>
              <span className={styles.username}>{participant.username}</span>
              <span className={styles.displayName}>{participant.displayName || participant.username}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}