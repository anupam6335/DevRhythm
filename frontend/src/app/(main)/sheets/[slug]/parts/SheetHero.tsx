'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FiCalendar, FiEdit2, FiTrash2, FiLogOut, FiLogIn, FiClock, FiUsers } from 'react-icons/fi';
import clsx from 'clsx';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { Avatar } from '@/shared/components/Avatar';
import Badge from '@/shared/components/Badge';
import { ROUTES } from '@/shared/config';
import type { Sheet, Participant } from '@/features/sheets';
import styles from './SheetHero.module.css';

interface SheetHeroProps {
  sheet: Sheet;
  participants: Participant[];
  totalParticipants: number;
  hasJoined: boolean;
  isOwner: boolean;
  targetDate?: string;
  onJoin: () => void;
  onLeave: () => void;
  onUpdateTargetDate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SheetHero({
  sheet,
  participants,
  totalParticipants,
  hasJoined,
  isOwner,
  targetDate,
  onJoin,
  onLeave,
  onUpdateTargetDate,
  onEdit,
  onDelete,
}: SheetHeroProps) {
  const { name, description, ownerId, createdAt, specialTag, originalSourceName, originalSourceUrl, slug } = sheet;
  const formattedCreatedAt = format(new Date(createdAt), 'MMM d, yyyy');

  const ownerParticipant = ownerId ? participants.find(p => p.userId === ownerId) : null;
  const ownerName = ownerParticipant?.username ||  'Anonymous User';
  const ownerAvatar = ownerParticipant?.avatarUrl;
  const ownerDisplayName = ownerParticipant?.displayName || ownerName;

  const targetDateObj = targetDate ? new Date(targetDate) : null;
  const isOverdue = targetDateObj && targetDateObj < new Date();
  const daysLeft = targetDateObj
    ? Math.ceil((targetDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Stacked avatars: show up to 6, with negative margin
  const displayParticipants = participants.slice(0, 6);
  const remainingCount = Math.max(0, totalParticipants - 6);

  return (
    <Card className={styles.hero} noHover>
      <div className={styles.heroContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>{name}</h1>
          {isOwner && (
            <div className={styles.ownerActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                leftIcon={<FiEdit2 />}
                className={styles.actionBtn}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                leftIcon={<FiTrash2 />}
                className={styles.actionBtn}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <p className={styles.description}>{description}</p>

        {(specialTag || originalSourceName) && (
          <div className={styles.tagsRow}>
            {specialTag && (
              <Badge variant="info" size="md" className={styles.specialTag}>
                {specialTag}
              </Badge>
            )}
            {originalSourceName && (
              <div className={styles.sourceBadge}>
                <span>Source:</span>
                {originalSourceUrl ? (
                  <a
                    href={originalSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {originalSourceName}
                  </a>
                ) : (
                  <span className={styles.sourceName}>{originalSourceName}</span>
                )}
              </div>
            )}
          </div>
        )}

      <div className={styles.ownerInfo}>
        <span className={styles.metaLabel}>Created by:</span>
        {ownerName !== 'Anonymous User' ? (
          <Link
            href={ROUTES.SHEETS.PROGRESS(slug, ownerName)}
            className={styles.ownerLink}
            title={`View ${ownerName}'s progress`}
          >
            <div className={styles.ownerAvatarWrapper}>
              <Avatar src={ownerAvatar} name={ownerDisplayName || ownerName} size="sm" className={styles.ownerAvatar} />
              <span className={styles.ownerName}>{ownerDisplayName || ownerName}</span>
            </div>
          </Link>
        ) : (
          <div className={styles.ownerAvatarWrapper}>
            <Avatar src={ownerAvatar} name={ownerDisplayName || ownerName} size="sm" className={styles.ownerAvatar} />
            <span className={styles.ownerName}>{ownerDisplayName || ownerName}</span>
          </div>
        )}
      </div>

        {/* Participants section – stacked avatars */}
        <div className={styles.participantsRow}>
          <div className={styles.participantAvatars}>
            {displayParticipants.map((p, idx) => (
              <Link
                key={p.userId}
                href={ROUTES.SHEETS.PROGRESS(slug, p.username)}
                className={clsx(styles.avatarLink, idx === 0 && styles.firstAvatar)}
                title={`View ${p.username}'s progress`}
              >
                <Avatar src={p.avatarUrl} name={p.username} size="md" />
              </Link>
            ))}
            {remainingCount > 0 && (
              <div className={styles.extraCount}>
                +{remainingCount}
              </div>
            )}
          </div>
          <div className={styles.participantStats}>
            <FiUsers className={styles.usersIcon} />
            <span>{totalParticipants} participants</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>
          {!hasJoined && !isOwner && (
            <Button variant="primary" size="md" onClick={onJoin} leftIcon={<FiLogIn />}>
              Join Sheet
            </Button>
          )}
          {hasJoined && !isOwner && (
            <Button variant="outline" size="md" onClick={onLeave} leftIcon={<FiLogOut />}>
              Leave Sheet
            </Button>
          )}
          {hasJoined && targetDate && (
            <div className={styles.targetDateWrapper}>
              <div className={styles.targetDateInfo}>
                <FiClock className={styles.targetIcon} />
                <span>Target: {format(new Date(targetDate), 'MMM d, yyyy')}</span>
                {isOverdue && <Badge variant="error" size="sm">Overdue</Badge>}
                {daysLeft !== null && daysLeft >= 0 && !isOverdue && (
                  <Badge variant="success" size="sm">{daysLeft} days left</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUpdateTargetDate}
                leftIcon={<FiEdit2 />}
                className={styles.updateTargetBtn}
              >
                Update
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}