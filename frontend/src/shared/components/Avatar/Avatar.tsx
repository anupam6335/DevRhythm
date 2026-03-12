import React, { useState, forwardRef } from "react";
import { FaUser } from "react-icons/fa";
import clsx from "clsx";
import { extractInitials } from "@/shared/lib";
import styles from "./Avatar.module.css";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "busy";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL. If not provided, initials are shown. */
  src?: string;
  /** Alternative text for the image (required if image is present). */
  alt?: string;
  /** User's name used to generate initials (fallback when no image). */
  name?: string;
  /** Size of the avatar. */
  size?: AvatarSize;
  /** Status indicator (bottom‑right dot). */
  status?: AvatarStatus;
  /** Badge content (e.g., number or icon). If provided, renders a badge. */
  badge?: React.ReactNode;
  /** If true, applies a focus/selected ring. */
  ring?: boolean;
  /** Additional class names. */
  className?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = "md",
      status,
      badge,
      ring = false,
      className,
      ...rest
    },
    ref
  ) => {
    const [imgError, setImgError] = useState(false);

    // Determine if we should render an image
    const shouldShowImage = src && !imgError;

    // Fallback content: initials or default icon
    let fallbackContent: React.ReactNode;
    if (name) {
      fallbackContent = <span className={styles.initials}>{extractInitials(name)}</span>;
    } else {
      fallbackContent = <FaUser className={styles.defaultIcon} />;
    }

    // Status label for screen readers
    const statusLabel = status
      ? {
          online: "Online",
          offline: "Offline",
          busy: "Do not disturb",
        }[status]
      : undefined;

    // Badge may need to be announced
    const badgeProps = badge
      ? {
          role: typeof badge === "number" ? "status" : undefined,
          "aria-label": typeof badge === "number" ? `${badge} notifications` : undefined,
        }
      : {};

    return (
      <div
        ref={ref}
        className={clsx(
          styles.avatar,
          styles[size],
          ring && styles.ring,
          className
        )}
        {...rest}
      >
        {shouldShowImage ? (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            onError={() => setImgError(true)}
            className={styles.image}
          />
        ) : (
          <div className={styles.fallback}>{fallbackContent}</div>
        )}

        {status && (
          <span
            className={clsx(styles.status, styles[`status-${status}`])}
            aria-label={statusLabel}
          />
        )}

        {badge && (
          <span className={styles.badge} {...badgeProps}>
            {badge}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export default Avatar;

// ----------------------------------------------------------------------
// AvatarGroup Component (stacked avatars)
// ----------------------------------------------------------------------

export interface AvatarGroupProps {
  /** Array of Avatar components or elements to stack */
  children: React.ReactNode;
  /** Maximum number of avatars to show (remaining are hidden behind a count) */
  max?: number;
  /** Size of the extra count avatar (defaults to "md") */
  size?: AvatarSize;
  /** Additional class name */
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max,
  size = "md",
  className,
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = max ? childrenArray.slice(0, max) : childrenArray;
  const extraCount = max ? childrenArray.length - max : 0;

  return (
    <div className={clsx(styles.avatarGroup, className)}>
      {visibleChildren}
      {extraCount > 0 && (
        <div className={clsx(styles.avatar, styles[size], styles.extraCount)}>
          +{extraCount}
        </div>
      )}
    </div>
  );
};