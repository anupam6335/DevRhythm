"use client";

import { useState } from "react";
import { FaCrown } from "react-icons/fa";
import { Avatar, AvatarGroup } from "@/shared/components/Avatar";

export default function HomePage() {
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Theme toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
        <button
          onClick={toggleTheme}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "2rem",
            border: "1px solid var(--border-input)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      <h1>Avatar Component Test Page</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Demonstrating all variants, sizes, statuses, badges, and groups.
      </p>

      {/* Basic Avatars */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>1. Basic Avatar</h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <Avatar src="https://images.unsplash.com/photo-1619024387526-4eab9b3bb305" alt="User with image" />
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>With image</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="John Doe" />
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Initials (JD)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar />
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Default icon</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="A" />
            <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Single initial</div>
          </div>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>2. Sizes</h2>
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
            <div key={size} style={{ textAlign: "center" }}>
              <Avatar name="Avatar" size={size}  src="https://images.unsplash.com/photo-1602077422495-c8733eb58c34" />
              <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{size}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Status */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>3. Status Indicator</h2>
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <Avatar src="https://images.unsplash.com/photo-1602077422495-c8733eb58c34" status="online" />
            <div style={{ color: "var(--text-muted)" }}>Online</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="MK" status="offline" />
            <div style={{ color: "var(--text-muted)" }}>Offline</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="Busy User" status="busy" size="lg" />
            <div style={{ color: "var(--text-muted)" }}>Busy (large)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="Small Online" size="xs" status="online" />
            <div style={{ color: "var(--text-muted)" }}>XS + online</div>
          </div>
        </div>
      </section>

      {/* Badge */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>4. Badge</h2>
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <Avatar src="https://images.unsplash.com/photo-1602077422495-c8733eb58c34" badge={3} />
            <div style={{ color: "var(--text-muted)" }}>Count badge</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="JD" badge={<FaCrown />} />
            <div style={{ color: "var(--text-muted)" }}>Icon badge (crown)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="Large Count" size="lg" badge={42} />
            <div style={{ color: "var(--text-muted)" }}>Large + count</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="With Status" status="online" badge={5} />
            <div style={{ color: "var(--text-muted)" }}>Status + badge</div>
          </div>
        </div>
      </section>

      {/* Ring */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>5. Ring (Selected / Focus)</h2>
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <Avatar src="https://i.pravatar.cc/96?img=9" ring />
            <div style={{ color: "var(--text-muted)" }}>With ring</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="Selected" ring size="lg" />
            <div style={{ color: "var(--text-muted)" }}>Large + ring</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="Ring+Status" status="busy" ring />
            <div style={{ color: "var(--text-muted)" }}>Ring + busy</div>
          </div>
        </div>
      </section>

      {/* Avatar Group */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>6. Avatar Group (Stacked)</h2>
        <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Default stacking</h3>
            <AvatarGroup>
              <Avatar src="https://images.unsplash.com/photo-1602077422495-c8733eb58c34" size="sm" />
              <Avatar src="https://plus.unsplash.com/premium_photo-1668443422726-a833ad5c0b77" size="sm" />
              <Avatar name="JD" size="sm" />
              <Avatar name="+3" size="sm" />
            </AvatarGroup>
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>With max=3</h3>
            <AvatarGroup max={3}>
              <Avatar src="https://images.unsplash.com/photo-1602077422495-c8733eb58c34" size="sm" />
              <Avatar src="https://plus.unsplash.com/premium_photo-1668443422726-a833ad5c0b77" size="sm" />
              <Avatar src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04" name="JD" size="sm" />
              <Avatar name="AL" size="sm" />
              <Avatar name="MK" size="sm" />
            </AvatarGroup>
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Mixed sizes (use same size)</h3>
            <AvatarGroup>
              <Avatar src="https://i.pravatar.cc/96?img=4" size="md" />
              <Avatar src="https://i.pravatar.cc/96?img=5" size="md" />
              <Avatar name="MD" size="md" />
            </AvatarGroup>
          </div>
        </div>
      </section>

      {/* Edge Cases */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>7. Edge Cases</h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <Avatar src="broken-image.jpg" name="Fallback Name" />
            <div style={{ color: "var(--text-muted)" }}>Broken image → initials</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar src="broken-image.jpg" />
            <div style={{ color: "var(--text-muted)" }}>Broken image → default icon</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="Very Long Name That Should Be Truncated to Initials" />
            <div style={{ color: "var(--text-muted)" }}>Long name → VL</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Avatar name="" /> {/* empty name */}
            <div style={{ color: "var(--text-muted)" }}>Empty name → default icon</div>
          </div>
        </div>
      </section>

      {/* Combined Example */}
      <section style={{ marginBottom: "3rem" }}>
        <h2>8. All Features Combined</h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <Avatar
            src="https://images.unsplash.com/photo-1611983512040-b8e48141cf4a"
            name="Jane Doe"
            size="xl"
            status="online"
            badge={99}
            ring
          />
          <Avatar
            name="Admin"
            size="lg"
            status="busy"
            badge={<FaCrown />}
            ring
          />
        </div>
      </section>
    </main>
  );
}