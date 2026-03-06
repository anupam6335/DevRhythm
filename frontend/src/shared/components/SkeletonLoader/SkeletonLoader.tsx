import React, { forwardRef, memo } from "react";
import clsx from "clsx";
import styles from "./SkeletonLoader.module.css";

export type SkeletonVariant =
  | "text"
  | "avatar"
  | "card"
  | "user-card"
  | "custom";

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant of the skeleton */
  variant?: SkeletonVariant;
  /** Number of times to repeat the skeleton (for lists) */
  count?: number;
  /** Height of the skeleton (for custom variant) */
  height?: number | string;
  /** Width of the skeleton (for custom variant) */
  width?: number | string;
  /** Additional class name */
  className?: string;
}

const SkeletonLoader = forwardRef<HTMLDivElement, SkeletonLoaderProps>(
  (
    {
      variant = "text",
      count = 1,
      height,
      width,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const items = Array.from({ length: count }, (_, i) => i);

    const getSkeletonStyle = (): React.CSSProperties => {
      const baseStyle: React.CSSProperties = { ...style };
      if (variant === "custom" && (height || width)) {
        if (height) baseStyle.height = height;
        if (width) baseStyle.width = width;
      }
      return baseStyle;
    };

    const renderItem = (index: number) => {
      const itemStyle = variant === "custom" ? getSkeletonStyle() : {};

      return (
        <div
          key={index}
          className={clsx(
            styles.skeleton,
            styles[variant],
            variant === "custom" && styles.custom,
            className
          )}
          style={itemStyle}
          {...rest}
        />
      );
    };

    if (variant === "user-card") {
      // UserCard layout: avatar + two lines
      return (
        <div className={styles.userCardLayout} ref={ref}>
          <div className={clsx(styles.skeleton, styles.avatar)} />
          <div className={styles.userCardContent}>
            <div className={clsx(styles.skeleton, styles.line, styles.lineShort)} />
            <div className={clsx(styles.skeleton, styles.line, styles.lineMedium)} />
          </div>
        </div>
      );
    }

    return <>{items.map(renderItem)}</>;
  }
);

SkeletonLoader.displayName = "SkeletonLoader";

export default memo(SkeletonLoader);