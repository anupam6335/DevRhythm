import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Content to show inside the tooltip */
  content: React.ReactNode;
  /** Preferred placement relative to the trigger element */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay in ms before showing/hiding the tooltip */
  delay?: number;
  /** Additional CSS class for the trigger container */
  className?: string;
  /** Disable the tooltip */
  disabled?: boolean;
  /** Optional ID for the tooltip (for accessibility) */
  id?: string;
}

/**
 * A polished, theme‑aware tooltip that renders in a portal to avoid clipping.
 * Follows WAI‑ARIA guidelines.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  delay = 200,
  className,
  disabled = false,
  id: externalId,
}) => {
  const generatedId = useId();
  const tooltipId = externalId || `tooltip-${generatedId}`;
  const [visible, setVisible] = useState(false);
  const [delayedVisible, setDelayedVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeout = useRef<NodeJS.Timeout | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update tooltip position based on trigger element's bounding rect
  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    const gap = 8; // space between trigger and tooltip

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap + window.scrollY;
        left = triggerRect.left + triggerRect.width / 2 + window.scrollX;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap + window.scrollY;
        left = triggerRect.left + triggerRect.width / 2 + window.scrollX;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 + window.scrollY;
        left = triggerRect.left - tooltipRect.width - gap + window.scrollX;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 + window.scrollY;
        left = triggerRect.right + gap + window.scrollX;
        break;
    }

    // Prevent tooltip from going off‑screen (basic boundary check)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    if (left + tooltipRect.width > viewportWidth + window.scrollX) {
      left = viewportWidth + window.scrollX - tooltipRect.width;
    }
    if (left < window.scrollX) {
      left = window.scrollX;
    }
    if (top + tooltipRect.height > viewportHeight + window.scrollY) {
      top = viewportHeight + window.scrollY - tooltipRect.height;
    }
    if (top < window.scrollY) {
      top = window.scrollY;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (visible && !disabled) {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      showTimeout.current = setTimeout(() => {
        setDelayedVisible(true);
        // Wait for tooltip to be rendered before measuring
        requestAnimationFrame(updatePosition);
      }, delay);
    } else {
      if (showTimeout.current) clearTimeout(showTimeout.current);
      hideTimeout.current = setTimeout(() => setDelayedVisible(false), delay);
    }

    return () => {
      if (showTimeout.current) clearTimeout(showTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [visible, delay, disabled]);

  // Update position on scroll or resize while visible
  useEffect(() => {
    if (!delayedVisible) return;
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [delayedVisible]);

  const showTooltip = () => setVisible(true);
  const hideTooltip = () => setVisible(false);

  return (
    <>
      <div
        className={clsx(styles.tooltipContainer, className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        ref={triggerRef}
        aria-describedby={delayedVisible ? tooltipId : undefined}
      >
        {children}
      </div>
      {delayedVisible && !disabled && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          ref={tooltipRef}
          className={clsx(
            styles.tooltip,
            styles[`tooltip${placement.charAt(0).toUpperCase() + placement.slice(1)}`],
            styles.tooltipVisible
          )}
          style={{
            top: position.top,
            left: position.left,
            transform: placement === 'top' || placement === 'bottom'
              ? 'translateX(-50%)'
              : 'translateY(-50%)',
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;