import React from 'react';
import {
  SiLeetcode,
  SiHackerrank,
  SiCodeforces,
  SiGeeksforgeeks,
} from 'react-icons/si';
import { FaCode } from 'react-icons/fa';
import clsx from 'clsx';
import styles from './PlatformIcon.module.css';

export interface PlatformIconProps {
  /** Platform name (case‑insensitive) */
  platform: string;
  /** Icon size */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Additional CSS class */
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

const platformIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  leetcode: SiLeetcode,
  hackerrank: SiHackerrank,
  codeforces: SiCodeforces,
  geeksforgeeks: SiGeeksforgeeks,
  // add more as needed
};

/**
 * Renders an icon for a given coding platform.
 * Falls back to a generic code icon if platform is not recognized.
 */
export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 'md',
  className,
}) => {
  const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '');
  const IconComponent = platformIcons[normalizedPlatform] || FaCode;

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <span
      className={clsx(styles.iconWrapper, className)}
      aria-label={`${platform} icon`}
      role="img"
    >
      <IconComponent size={iconSize} className={styles.icon} />
    </span>
  );
};

export default PlatformIcon;