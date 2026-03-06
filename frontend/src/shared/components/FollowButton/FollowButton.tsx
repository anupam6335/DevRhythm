"use client";

import React, { forwardRef, memo } from "react";
import { FaUserPlus, FaUserCheck, FaSpinner } from "react-icons/fa";
import clsx from "clsx";
import styles from "./FollowButton.module.css";

export type FollowButtonSize = "sm" | "md" | "lg";

export interface FollowButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  userId: string;
  isFollowing: boolean;
  isLoading?: boolean;
  size?: FollowButtonSize;
  onFollow: (userId: string) => void;
  className?: string;
}

const FollowButton = forwardRef<HTMLButtonElement, FollowButtonProps>(
  (
    {
      userId,
      isFollowing,
      isLoading = false,
      size = "md",
      onFollow,
      className,
      disabled,
      ...rest
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isLoading || disabled) return;
      onFollow(userId);
    };

    const label = isFollowing
      ? `Unfollow user ${userId}`
      : `Follow user ${userId}`;

    return (
      <button
        ref={ref}
        className={clsx(
          styles.followButton,
          styles[size],
          isFollowing && styles.following,
          isLoading && styles.loading,
          className
        )}
        onClick={handleClick}
        disabled={disabled || isLoading}
        aria-label={label}
        aria-pressed={isFollowing}
        aria-busy={isLoading}
        {...rest}
      >
        {isLoading ? (
          <FaSpinner className={clsx(styles.icon, styles.spinner)} />
        ) : isFollowing ? (
          <FaUserCheck className={styles.icon} />
        ) : (
          <FaUserPlus className={styles.icon} />
        )}
        <span className={styles.text}>
          {isLoading ? "Loading" : isFollowing ? "Following" : "Follow"}
        </span>
      </button>
    );
  }
);

FollowButton.displayName = "FollowButton";

export default memo(FollowButton);