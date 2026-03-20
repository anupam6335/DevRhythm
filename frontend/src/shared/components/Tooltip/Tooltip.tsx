"use client";

import React, { useState, useRef, useEffect, useId, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  disabled?: boolean;
  id?: string;
  ref?: React.Ref<HTMLDivElement>; // not used directly, but can be passed to the trigger container
}

export const Tooltip: React.FC<TooltipProps> = memo(
  ({
    children,
    content,
    placement = 'top',
    delay = 200,
    className,
    disabled = false,
    id: externalId,
    ref,
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

    const updatePosition = useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;
      const gap = 8;

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

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (left + tooltipRect.width > viewportWidth + window.scrollX) {
        left = viewportWidth + window.scrollX - tooltipRect.width;
      }
      if (left < window.scrollX) left = window.scrollX;
      if (top + tooltipRect.height > viewportHeight + window.scrollY) {
        top = viewportHeight + window.scrollY - tooltipRect.height;
      }
      if (top < window.scrollY) top = window.scrollY;

      setPosition({ top, left });
    }, [placement]);

    useEffect(() => {
      if (visible && !disabled) {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        showTimeout.current = setTimeout(() => {
          setDelayedVisible(true);
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
    }, [visible, delay, disabled, updatePosition]);

    useEffect(() => {
      if (!delayedVisible) return;
      const handleUpdate = () => updatePosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }, [delayedVisible, updatePosition]);

    const showTooltip = useCallback(() => setVisible(true), []);
    const hideTooltip = useCallback(() => setVisible(false), []);

    return (
      <>
        <div
          ref={(node) => {
            triggerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          className={clsx(styles.tooltipContainer, className)}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
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
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;