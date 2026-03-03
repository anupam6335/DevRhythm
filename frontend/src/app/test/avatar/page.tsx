// frontend/src/app/test/avatar/page.tsx
"use client";

import React from "react";
import { Avatar, AvatarGroup } from "@/shared/components/Avatar";
import ThemeToggle from "@/shared/components/ThemeToggle";
import { FaCheck, FaBell } from "react-icons/fa";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--bg-surface)",
  padding: "1rem",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  alignItems: "center",
  flexWrap: "wrap",
};

export default function AvatarTestPage() {
  return (
    <main
      style={{
        padding: "1.5rem",
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontFamily: "var(--font-heading)", margin: 0 }}>
          Avatar Component – Test Page
        </h1>
        <ThemeToggle variant="both" label="Toggle theme" />
      </div>

      {/* Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
        }}
      >
        {/* Sizes */}
        <section style={cardStyle}>
          <strong>Sizes</strong>
          <div style={rowStyle}>
            <Avatar size="xs" name="Extra Small" />
            <Avatar size="sm" name="Small" />
            <Avatar size="md" name="Medium" />
            <Avatar size="lg" name="Large" />
            <Avatar size="xl" name="Extra Large" />
          </div>
        </section>

        {/* Images */}
        <section style={cardStyle}>
          <strong>Images</strong>
          <div style={rowStyle}>
            <Avatar src="https://i.pravatar.cc/150?img=1" alt="User 1" size="md" />
            <Avatar src="https://i.pravatar.cc/150?img=2" alt="User 2" size="lg" ring />
            <Avatar src="https://i.pravatar.cc/150?img=3" alt="User 3" size="xl" />
            <Avatar src="invalid-src" name="Fallback" size="md" />
          </div>
        </section>

        {/* Status */}
        <section style={cardStyle}>
          <strong>Status</strong>
          <div style={rowStyle}>
            <Avatar name="Online" status="online" size="lg" />
            <Avatar name="Offline" status="offline" size="lg" />
            <Avatar name="Busy" status="busy" size="lg" />
            <Avatar src="https://i.pravatar.cc/150?img=4" status="online" size="lg" />
          </div>
        </section>

        {/* Badges */}
        <section style={cardStyle}>
          <strong>Badges</strong>
          <div style={rowStyle}>
            <Avatar name="Notification" badge={3} size="lg" />
            <Avatar name="Icon Badge" badge={<FaCheck />} size="lg" />
            <Avatar name="Mixed" badge={5} status="online" size="lg" ring />
            <Avatar src="https://i.pravatar.cc/150?img=5" badge={<FaBell />} size="lg" />
          </div>
        </section>

        {/* Rings */}
        <section style={cardStyle}>
          <strong>Rings</strong>
          <div style={rowStyle}>
            <Avatar name="Selected" ring size="lg" />
            <Avatar src="https://i.pravatar.cc/150?img=6" ring size="lg" />
            <Avatar name="With status" status="online" ring size="lg" badge={2} />
          </div>
        </section>

        {/* Fallbacks */}
        <section style={cardStyle}>
          <strong>Fallbacks</strong>
          <div style={rowStyle}>
            <Avatar name="John Doe" size="lg" />
            <Avatar name="A" size="lg" />
            <Avatar name="Maria Garcia Lopez" size="lg" />
            <Avatar size="lg" />
          </div>
        </section>

        {/* AvatarGroup */}
        <section style={cardStyle}>
          <strong>AvatarGroup</strong>
          <AvatarGroup>
            <Avatar src="https://i.pravatar.cc/150?img=7" />
            <Avatar src="https://i.pravatar.cc/150?img=8" />
            <Avatar src="https://i.pravatar.cc/150?img=9" />
            <Avatar src="https://i.pravatar.cc/150?img=10" />
          </AvatarGroup>

          <AvatarGroup max={3}>
            <Avatar name="Alice" />
            <Avatar name="Bob" />
            <Avatar name="Charlie" />
            <Avatar name="Diana" />
            <Avatar name="Eve" />
          </AvatarGroup>

          <AvatarGroup max={4}>
            <Avatar src="https://i.pravatar.cc/150?img=11" status="online" />
            <Avatar src="https://i.pravatar.cc/150?img=12" badge={2} />
            <Avatar src="https://i.pravatar.cc/150?img=13" status="busy" ring />
            <Avatar src="https://i.pravatar.cc/150?img=14" />
          </AvatarGroup>

          <AvatarGroup max={3} size="sm">
            <Avatar name="Small 1" />
            <Avatar name="Small 2" />
            <Avatar name="Small 3" />
            <Avatar name="Small 4" />
          </AvatarGroup>
        </section>
      </div>
    </main>
  );
}