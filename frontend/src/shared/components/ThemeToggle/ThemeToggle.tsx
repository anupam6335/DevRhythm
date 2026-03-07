'use client'
import React, { useEffect, useState } from 'react';
import { RxSun, RxMoon } from 'react-icons/rx';
import { useTheme } from '@/shared/hooks/useTheme';
import styles from './ThemeToggle.module.css';

export type ThemeToggleVariant = 'icon' | 'text' | 'both';

export interface ThemeToggleProps {
  /** Additional CSS class names for the button */
  className?: string;
  /** Visual variant: icon only, text only, or both */
  variant?: ThemeToggleVariant;
  /** Custom text for the label (overrides auto-generated text) */
  label?: string;
}

/**
 * A button that toggles the application theme between light and dark.
 * Supports multiple display variants: icon, text, or both.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'icon',
  label,
}) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder to prevent layout shift
    return <div className={`${styles.toggleButton} ${className}`} style={{ visibility: 'hidden' }} />;
  }

  const isDark = resolvedTheme === 'dark';
  const defaultLabel = `Switch to ${isDark ? 'light' : 'dark'} mode`;
  const buttonLabel = label || defaultLabel;

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const icon = isDark ? <RxSun className={styles.icon} /> : <RxMoon className={styles.icon} />;
  const text = isDark ? 'Light mode' : 'Dark mode';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${styles.toggleButton} ${styles[variant]} ${className}`}
      aria-label={buttonLabel}
      aria-pressed={isDark}
      title={buttonLabel}
    >
      {(variant === 'icon' || variant === 'both') && icon}
      {(variant === 'text' || variant === 'both') && (
        <span className={styles.text}>{text}</span>
      )}
      <span className="sr-only">{buttonLabel}</span>
    </button>
  );
};

export default ThemeToggle;