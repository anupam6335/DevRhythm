'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { FiUsers, FiCalendar, FiExternalLink, FiTag } from 'react-icons/fi';
import clsx from 'clsx';
import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import { Avatar } from '@/shared/components/Avatar';
import Badge from '@/shared/components/Badge';
import { ROUTES } from '@/shared/config';
import type { SheetWithStats } from '@/features/sheets';
import styles from './SheetCard.module.css';

interface SheetCardProps {
  sheet: SheetWithStats;
  isOwner: boolean;
  isJoined: boolean;   // NEW: whether current user has joined this sheet
  onJoin: () => void;
  className?: string;
}

export default function SheetCard({ sheet, isOwner, isJoined, onJoin, className }: SheetCardProps) {
  const {
    name,
    description,
    ownerId,
    createdAt,
    participantCount,
    participants,
    slug,
    specialTag,
    originalSourceName,
    originalSourceUrl,
  } = sheet;
  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy');

  const ownerParticipant = ownerId ? participants.find(p => p.userId === ownerId) : null;
  const ownerName = ownerParticipant?.username ||  'Anonymous User';
  const displayName = ownerParticipant?.displayName || ownerName;
  const ownerAvatar = ownerParticipant?.avatarUrl;

  const displayParticipants = participants.slice(0, 4);
  const remainingCount = Math.max(0, participantCount - 4);

  // Show "View" if owner or already joined, otherwise "Join"
  const showViewButton = isOwner || isJoined;
  const buttonText = showViewButton ? 'View' : 'Join';
  const buttonVariant = showViewButton ? 'outline' : 'primary';

  const handleAction = () => {
    if (showViewButton) {
      window.location.href = ROUTES.SHEETS.DETAIL(slug);
    } else {
      onJoin();
    }
  };

  return (
    <Card className={clsx(styles.card, className)} noHover>
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.titleSection}>
            <h3 className={styles.sheetTitle}>
              <Link href={ROUTES.SHEETS.DETAIL(slug)} className={styles.titleLink}>
                {name}
              </Link>
            </h3>
            <Button
              variant={buttonVariant}
              size="sm"
              onClick={handleAction}
              className={styles.actionButton}
            >
              {buttonText}
            </Button>
          </div>
          <p className={styles.description}>{description}</p>
        </div>

        {(specialTag || originalSourceName) && (
          <div className={styles.tagsRow}>
            {specialTag && (
              <Badge variant="info" size="sm" className={styles.specialTag}>
                <FiTag className={styles.tagIcon} />
                {specialTag}
              </Badge>
            )}
            {originalSourceName && (
              <div className={styles.sourceBadge}>
                <span>Source: </span>
                {originalSourceUrl ? (
                  <a
                    href={originalSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {originalSourceName}
                    <FiExternalLink className={styles.externalIcon} />
                  </a>
                ) : (
                  <span className={styles.sourceName}>{originalSourceName}</span>
                )}
              </div>
            )}
          </div>
        )}

        <div className={styles.ownerInfo}>
          <span className={styles.ownerLabel}>Created by:</span>
          {ownerName !== 'Anonymous User' ? (
            <Link
              href={ROUTES.SHEETS.PROGRESS(slug, ownerName)}
              className={styles.ownerLink}
              title={`View ${ownerName}'s progress`}
            >
              <div className={styles.ownerAvatarWrapper}>
                <div className={styles.ownerAvatarContainer}>
                  <Avatar src={ownerAvatar} name={ownerName} size="xs" className={styles.ownerAvatar} />
                </div>
                <span className={styles.ownerName}>{displayName || ownerName}</span>
              </div>
            </Link>
          ) : (
            <div className={styles.ownerAvatarWrapper}>
              <div className={styles.ownerAvatarContainer}>
                <Avatar src={ownerAvatar} name={ownerName} size="xs" className={styles.ownerAvatar} />
              </div>
              <span className={styles.ownerName}>{displayName || ownerName}</span>
            </div>
          )}
        </div>

        <div className={styles.participantsSection}>
          <div className={styles.participantHeader}>
            <FiUsers className={styles.participantIcon} />
            <span className={styles.participantCount}>
              Participants ({participantCount})
            </span>
          </div>
          <div className={styles.avatarGroupWrapper}>
            {displayParticipants.map((p, idx) => (
              <Link
                key={p.userId}
                href={ROUTES.SHEETS.PROGRESS(slug, p.username)}
                className={clsx(styles.avatarLink, idx === 0 && styles.firstAvatar)}
                title={`View ${p.username}'s progress`}
              >
                <Avatar src={p.avatarUrl} name={p.username} size="sm" />
              </Link>
            ))}
            {remainingCount > 0 && (
              <div className={styles.extraBadge}>
                +{remainingCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}