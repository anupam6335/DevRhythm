"use client";

import React, { forwardRef, memo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FaFire, FaSpinner } from "react-icons/fa";
import { Avatar } from "@/shared/components/Avatar";
import FollowButton from "@/shared/components/FollowButton";
import { formatNumber } from "@/shared/lib";
import type { User } from "@/shared/types";
import styles from "./UserCard.module.css";

export type UserCardSize = "sm" | "md";

export interface UserCardProps extends React.HTMLAttributes<HTMLDivElement> {
  user: User;
  showStats?: boolean;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollow?: (userId: string) => void;
  href?: string;
  size?: UserCardSize;
  mutualFollowers?: number;
  reason?: string;
}

const UserCard = forwardRef<HTMLDivElement, UserCardProps>(
  (
    {
      user,
      showStats = true,
      showFollowButton = true,
      isFollowing,
      onFollow,
      href,
      size = "md",
      mutualFollowers,
      reason,
      className,
      ...rest
    },
    ref
  ) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { _id: userId, username, displayName, avatarUrl, stats, streak } = user;

    const avatarSize = size === "sm" ? "sm" : "lg";

    const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      if (!href) return;
      startTransition(() => {
        router.push(href);
      });
    };

    const content = (
      <>
        <Avatar
          src={avatarUrl}
          name={displayName || username}
          size={avatarSize}
          className={styles.avatar}
        />
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <span className={styles.displayName}>{displayName || username}</span>
            <span className={styles.username}>@{username}</span>
          </div>
          {showStats && (
            <div className={styles.stats}>
              <span className={styles.statItem}>
                <span className={styles.statLabel}>Solved</span>
                <span className={styles.statValue}>
                  {formatNumber(stats?.totalSolved || 0)}
                </span>
              </span>
              <span className={styles.statItem}>
                <FaFire className={styles.fireIcon} />
                <span className={styles.statValue}>{streak?.current || 0}</span>
              </span>
            </div>
          )}
          {mutualFollowers !== undefined && mutualFollowers > 0 && (
            <span className={styles.mutual}>
              {mutualFollowers} mutual follower{mutualFollowers !== 1 ? "s" : ""}
            </span>
          )}
          {reason && <div className={styles.reason}>{reason}</div>}
        </div>
        {showFollowButton && onFollow && (
          <FollowButton
            userId={userId}
            isFollowing={!!isFollowing}
            onFollow={onFollow}
            size={size === "sm" ? "sm" : "md"}
            className={styles.followButton}
          />
        )}

        {/* Loading overlay for navigation */}
        {isPending && (
          <div className={styles.loadingOverlay} aria-label="Loading profile">
            <FaSpinner className={styles.loadingSpinner} />
            <span className={styles.loadingText}>Loading...</span>
          </div>
        )}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          prefetch={true}
          onClick={handleNavigate}
          className={clsx(styles.userCard, styles.link, styles[size], className)}
          ref={ref as any}
          {...(rest as any)}
          aria-busy={isPending}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        ref={ref}
        className={clsx(styles.userCard, styles[size], className)}
        {...rest}
      >
        {content}
      </div>
    );
  }
);

UserCard.displayName = "UserCard";

export default memo(UserCard);