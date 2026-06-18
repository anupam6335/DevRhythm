'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FiSettings,
  FiCalendar,
  FiStar,
  FiUsers,
  FiTarget,
  FiAward,
} from 'react-icons/fi';
import { FaFire, FaTrophy, FaLeaf, FaRegGem, FaStar } from 'react-icons/fa';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { format } from 'date-fns';

import { Avatar } from '@/shared/components/Avatar';
import Button from '@/shared/components/Button';
import { toast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { followService } from '@/features/follow/services/followService';
import { userService } from '@/features/user/services/userService';
import { userKeys } from '@/shared/lib/react-query';
import { formatNumber } from '@/shared/lib/stringUtils';

import type { User } from '@/shared/types';
import styles from './ProfileHeader.module.css';

export interface ProfileHeaderProps {
  user: User;
  isOwnProfile?: boolean;
  className?: string;
}

// Helper to compute badges from user stats
const computeBadges = (user: User) => {
  const badges: Array<{ label: string; icon: React.ReactNode }> = [];
  const { totalSolved } = user?.stats;
  const { current } = user?.streak;
  const { masteryRate, totalRevisions, activeDays } = user?.stats;

  if (totalSolved >= 100) badges.push({ label: 'Century Club', icon: <FaTrophy /> });
  if (totalSolved >= 500) badges.push({ label: 'Half‑Millennium', icon: <FaRegGem /> });
  if (current >= 30) badges.push({ label: 'Streak Keeper', icon: <FaFire /> });
  if (masteryRate >= 80) badges.push({ label: 'Top 10%', icon: <FaStar /> });
  if (totalRevisions >= 100) badges.push({ label: 'Revision Master', icon: <FiTarget /> });
  if (activeDays >= 100) badges.push({ label: 'Faithful', icon: <FaLeaf /> });

  return badges;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile = false,
  className,
}) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Follow status – only fetch if not own profile and logged in
  const { data: followStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['follow', 'status', currentUser?._id, user._id],
    queryFn: () => followService.getFollowStatus(user._id),
    enabled: !isOwnProfile && !!currentUser,
    staleTime: 2 * 60 * 1000,
  });

  // Follow / unfollow mutations
  const followMutation = useMutation({
    mutationFn: () => followService.followUser(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['follow', 'status', currentUser?._id, user._id],
      });
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      toast.success(`You are now following ${user.displayName || user.username}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to follow user');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => followService.unfollowUser(user._id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['follow', 'status', currentUser?._id, user._id],
      });
      queryClient.invalidateQueries({ queryKey: ['follow'] });
      toast.success(`You have unfollowed ${user.displayName || user.username}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unfollow user');
    },
  });

  const handleFollowToggle = () => {
    if (followStatus?.isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user?.displayName || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const updateNameMutation = useMutation({
    mutationFn: (newName: string) => userService.updateUser({ displayName: newName }),
    onSuccess: () => {
      toast.success('Display name updated');
      // Reload page to reflect updated name everywhere
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update display name');
      // Revert to original name
      setEditNameValue(user?.displayName || '');
      setIsEditingName(false);
    },
  });

  const startEditing = () => {
    if (isOwnProfile) {
      setIsEditingName(true);
      setEditNameValue(user?.displayName || '');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditNameValue(e.target.value);
  };

  const handleNameBlur = () => {
    if (editNameValue.trim() !== user?.displayName) {
      updateNameMutation.mutate(editNameValue.trim());
    } else {
      setIsEditingName(false);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setEditNameValue(user?.displayName || '');
    }
  };

  const isOnline = user?.isOnline ?? false;
  const badges = computeBadges(user);
  const memberSince = format(new Date(user?.accountCreated), 'MMM yyyy');

  return (
    <div className={clsx(styles.container, className)}>
      {/* Avatar with triple ripple effect */}
      <div className={styles.avatarWrapper}>
        <Avatar
          src={user?.avatarUrl}
          name={user?.displayName || user?.username}
          size="xl"
          status={isOnline ? 'online' : 'offline'}
          className={styles.avatar}
        />
        <div className={styles.ripple} aria-hidden="true" />
        <div className={styles.ripple} aria-hidden="true" />
        <div className={styles.ripple} aria-hidden="true" />
      </div>

      {/* Name and action button(s) */}
      <div className={styles.nameSection}>
        <div className={styles.nameRow}>
          {isEditingName && isOwnProfile ? (
            <input
              ref={inputRef}
              type="text"
              value={editNameValue}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              className={styles.nameInput}
              disabled={updateNameMutation.isPending}
            />
          ) : (
            <h1 className={styles.displayName}>
              {user?.displayName}
              {isOwnProfile && (
                <button
                  className={styles.editNameButton}
                  onClick={startEditing}
                  aria-label="Edit display name"
                >
                  <FiSettings />
                </button>
              )}
            </h1>
          )}
          {!isOwnProfile && currentUser && (
            <Button
              variant={followStatus?.isFollowing ? 'outline' : 'primary'}
              size="sm"
              onClick={handleFollowToggle}
              isLoading={followMutation.isPending || unfollowMutation.isPending}
              disabled={statusLoading}
            >
              {followStatus?.isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </div>
        <p className={styles.username}>@{user?.username}</p>
        <div className={styles.memberSince}>
          <FiCalendar /> member since {memberSince}
        </div>
      </div>

      {/* Solved trunk */}
      <div className={styles.trunk}>
        <span className={styles.trunkValue}>
          {formatNumber(user?.stats.totalSolved)}
        </span>
        <span className={styles.trunkLabel}>total question solved</span>
      </div>

      {/* Stat pills */}
      <div className={styles.statPills}>
        <div className={styles.statPill}>
          <FaFire className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{user?.streak.current}</span>
          <span className={styles.statPillLabel}>streak</span>
        </div>
        <div className={styles.statPill}>
          <FiStar className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{user?.stats.masteryRate}%</span>
          <span className={styles.statPillLabel}>mastery</span>
        </div>
        <div className={styles.statPill}>
          <FiUsers className={styles.statPillIcon} />
          <span className={styles.statPillValue}>
            {formatNumber(user?.followersCount)}
          </span>
          <span className={styles.statPillLabel}>followers</span>
        </div>
        <div className={styles.statPill}>
          <FiUsers className={styles.statPillIcon} />
          <span className={styles.statPillValue}>
            {formatNumber(user?.followingCount)}
          </span>
          <span className={styles.statPillLabel}>following</span>
        </div>
        <div className={styles.statPill}>
          <FiAward className={styles.statPillIcon} />
          <span className={styles.statPillValue}>{user?.streak.longest}</span>
          <span className={styles.statPillLabel}>longest</span>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className={styles.badges}>
          {badges.map((badge, idx) => (
            <div key={idx} className={styles.badge}>
              <span className={styles.badgeIcon}>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;