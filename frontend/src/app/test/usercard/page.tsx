"use client";

import React, { useState } from "react";
import UserCard from "@/shared/components/UserCard";
import SkeletonLoader from "@/shared/components/SkeletonLoader";
import type { User } from "@/shared/types";

// Mock user data matching the backend User model
const mockUser: User = {
  _id: "123",
  authProvider: "github",
  providerId: "gh_123",
  email: "john@example.com",
  username: "johndoe",
  displayName: "John Doe",
  avatarUrl: "https://avatars.githubusercontent.com/u/1",
  streak: { current: 7, longest: 15, lastActiveDate: new Date().toISOString() },
  stats: {
    totalSolved: 42,
    masteryRate: 68,
    totalRevisions: 23,
    totalTimeSpent: 3600,
    activeDays: 45,
  },
  preferences: {
    timezone: "UTC",
    notifications: {
      revisionReminders: true,
      goalTracking: true,
      socialInteractions: true,
      weeklyReports: true,
    },
    dailyGoal: 3,
    weeklyGoal: 15,
  },
  lastOnline: new Date().toISOString(),
  accountCreated: new Date().toISOString(),
  followersCount: 10,
  followingCount: 5,
  privacy: "public",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function UserCardTestPage() {
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = (userId: string) => {
    console.log("Follow action for user:", userId);
    setIsFollowing((prev) => !prev);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ marginBottom: "2rem", fontFamily: "var(--font-heading)" }}>
        UserCard Test Page
      </h1>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Default (md, with stats, follow button)</h2>
        <UserCard
          user={mockUser}
          showStats
          showFollowButton
          isFollowing={isFollowing}
          onFollow={handleFollow}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Small size (sm)</h2>
        <UserCard
          user={mockUser}
          size="sm"
          showStats
          showFollowButton
          isFollowing={isFollowing}
          onFollow={handleFollow}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>As a link (href)</h2>
        <UserCard
          user={mockUser}
          href="/users/johndoe"
          showStats
          showFollowButton={false}
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>With mutual followers and reason</h2>
        <UserCard
          user={mockUser}
          showStats
          showFollowButton
          isFollowing={false}
          onFollow={handleFollow}
          mutualFollowers={3}
          reason="Similar problem‑solving patterns"
        />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Loading skeleton (user‑card variant)</h2>
        <SkeletonLoader variant="user-card" />
      </section>

      {/* New section: custom skeleton */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>Custom skeleton (width/height)</h2>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <SkeletonLoader variant="custom" width="80px" height="80px" />
          <SkeletonLoader variant="custom" width="200px" height="40px" />
          <SkeletonLoader variant="custom" width="120px" height="120px" />
        </div>
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          You can set any width and height for custom skeletons.
        </p>
      </section>
    </div>
  );
}