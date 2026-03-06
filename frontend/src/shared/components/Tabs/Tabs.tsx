import React, { useCallback } from 'react';
import clsx from 'clsx';
import styles from './Tabs.module.css';

export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label – can be text or any React node */
  label: React.ReactNode;
  /** Optional icon element (e.g., from react-icons) */
  icon?: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabsProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab id */
  activeTab: string;
  /** Callback when active tab changes */
  onChange: (tabId: string) => void;
  /** Additional CSS class for the container */
  className?: string;
  /** Visual style: underline (default) or pills */
  variant?: 'underline' | 'pills';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether tabs should take full width of the container */
  fullWidth?: boolean;
}

/**
 * Tabs component for switching between different views.
 * Follows WAI-ARIA tab pattern with keyboard navigation (←/→).
 *
 * @example
 * <Tabs
 *   tabs={[
 *     { id: 'tab1', label: 'Overview' },
 *     { id: 'tab2', label: 'Details', icon: <InfoIcon /> }
 *   ]}
 *   activeTab="tab1"
 *   onChange={(id) => console.log(id)}
 * />
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, tabId: string) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight') {
        nextIndex = currentIndex + 1;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex - 1;
      } else {
        return;
      }

      e.preventDefault();

      // Find next enabled tab
      while (nextIndex !== null && nextIndex >= 0 && nextIndex < tabs.length) {
        if (!tabs[nextIndex].disabled) {
          onChange(tabs[nextIndex].id);
          break;
        }
        nextIndex = e.key === 'ArrowRight' ? nextIndex + 1 : nextIndex - 1;
      }
    },
    [tabs, onChange]
  );

  return (
    <div
      className={clsx(
        styles.tabs,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
      )}
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            tabIndex={isActive && !tab.disabled ? 0 : -1}
            className={clsx(
              styles.tab,
              isActive && styles.active,
              tab.disabled && styles.disabled
            )}
            onClick={() => {
              if (!tab.disabled && tab.id !== activeTab) {
                onChange(tab.id);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;