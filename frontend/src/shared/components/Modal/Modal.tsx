"use client";

import React, { useEffect, useRef, useCallback, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import clsx from 'clsx';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  /** Controls the visibility of the modal */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Optional title displayed in the modal header */
  title?: string;
  /** Optional ID of an element that describes the modal (for aria-describedby) */
  describedBy?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Size variant of the modal */
  size?: ModalSize;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape key closes the modal */
  closeOnEsc?: boolean;
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Custom close icon (React element) */
  closeIcon?: React.ReactNode;
  /** Callback invoked when a close attempt is made (can prevent closing) */
  onCloseAttempt?: (event: { source: 'escape' | 'backdrop' | 'closeButton' }) => boolean | void;
  /** Additional class name for the modal content wrapper */
  className?: string;
  /** Additional class name for the overlay */
  overlayClassName?: string;
  /** Ref to an element that should receive focus when the modal opens */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Ref to an element that should receive focus when the modal closes (defaults to the element that had focus before opening) */
  returnFocusRef?: React.RefObject<HTMLElement>;
  /** Whether to prevent body scrolling while modal is open (default: true) */
  preventScroll?: boolean;
}

// Map to track open modals and manage scroll lock reliably
const openModals = new Set<symbol>();

/**
 * Modal component – accessible, animated, and fully customizable dialog.
 *
 * Features:
 * - Full accessibility (ARIA, focus trap, keyboard navigation)
 * - Smooth enter/exit animations with prefers-reduced-motion support
 * - Body scroll lock with width compensation to prevent layout shift
 * - Proper focus trap that cycles focus within the modal
 * - Reliable stacked modal handling using a Set
 * - Customizable close icon, size variants, and close prevention
 * - Focus management with initial/return focus
 */
const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      describedBy,
      children,
      footer,
      size = 'md',
      closeOnBackdropClick = true,
      closeOnEsc = true,
      showCloseButton = true,
      closeIcon = <IoClose />,
      onCloseAttempt,
      className,
      overlayClassName,
      initialFocusRef,
      returnFocusRef,
      preventScroll = true,
    },
    forwardedRef
  ) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const titleId = useId();
    const modalId = useRef(Symbol('modal')).current; // Unique identifier for this modal instance

    // Scroll lock with width compensation – uses a Set to handle multiple modals reliably
    useEffect(() => {
      if (!preventScroll) return;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      if (isOpen) {
        // If this is the first modal opening, lock scroll and store padding
        if (openModals.size === 0) {
          previouslyFocusedElement.current = document.activeElement as HTMLElement;
          document.body.style.overflow = 'hidden';
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
        openModals.add(modalId);
      } else {
        openModals.delete(modalId);
        if (openModals.size === 0) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }

      return () => {
        // Cleanup if component unmounts while open
        if (openModals.has(modalId)) {
          openModals.delete(modalId);
          if (openModals.size === 0) {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          }
        }
      };
    }, [isOpen, preventScroll, modalId]);

    // Focus trap – intercept Tab key and cycle focus within modal
    useEffect(() => {
      if (!isOpen || !modalRef.current) return;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    // Set initial focus when modal opens
    useEffect(() => {
      if (!isOpen || !modalRef.current) return;

      const setFocus = () => {
        const focusableElements = modalRef.current!.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (initialFocusRef?.current && document.contains(initialFocusRef.current)) {
          initialFocusRef.current.focus();
        } else if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current!.focus();
        }
      };

      // Slight delay to ensure DOM is ready (especially with animations)
      const timeoutId = setTimeout(setFocus, 50);
      return () => clearTimeout(timeoutId);
    }, [isOpen, initialFocusRef]);

    // Handle Escape key with potential prevention
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (closeOnEsc && event.key === 'Escape' && isOpen) {
          const shouldClose = onCloseAttempt?.({ source: 'escape' }) !== false;
          if (shouldClose) {
            triggerClose();
          }
        }
      },
      [closeOnEsc, isOpen, onCloseAttempt]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
      } else {
        document.removeEventListener('keydown', handleKeyDown);
      }
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleKeyDown]);

    // Handle backdrop click
    const handleOverlayClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnBackdropClick && event.target === overlayRef.current) {
          const shouldClose = onCloseAttempt?.({ source: 'backdrop' }) !== false;
          if (shouldClose) {
            triggerClose();
          }
        }
      },
      [closeOnBackdropClick, onCloseAttempt]
    );

    // Handle close button click
    const handleCloseButtonClick = useCallback(() => {
      const shouldClose = onCloseAttempt?.({ source: 'closeButton' }) !== false;
      if (shouldClose) {
        triggerClose();
      }
    }, [onCloseAttempt]);

    // Unified close trigger that starts exit animation
    const triggerClose = useCallback(() => {
      setIsAnimatingOut(true);
    }, []);

    // Handle animation end: when exit animation finishes, actually call onClose
    const handleAnimationEnd = useCallback(() => {
      if (isAnimatingOut) {
        setIsAnimatingOut(false);
        onClose();
      }
    }, [isAnimatingOut, onClose]);

    // Return focus when closed (after animation)
    useEffect(() => {
      if (!isOpen && !isAnimatingOut) {
        const target = returnFocusRef?.current || previouslyFocusedElement.current;
        if (target && document.contains(target) && typeof target.focus === 'function') {
          target.focus();
        }
      }
    }, [isOpen, isAnimatingOut, returnFocusRef]);

    // If modal is closed and not animating out, render nothing
    if (!isOpen && !isAnimatingOut) return null;

    return createPortal(
      <div
        ref={overlayRef}
        className={clsx(styles.overlay, overlayClassName, {
          [styles.overlayClosing]: isAnimatingOut,
        })}
        onClick={handleOverlayClick}
        role="presentation"
      >
        <div
          ref={(node) => {
            modalRef.current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          className={clsx(styles.modal, styles[size], className, {
            [styles.modalClosing]: isAnimatingOut,
          })}
          onAnimationEnd={handleAnimationEnd}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={describedBy}
          tabIndex={-1}
        >
          {/* Header */}
          <div className={styles.header}>
            {title && (
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={handleCloseButtonClick}
                className={styles.closeButton}
                aria-label="Close modal"
              >
                {closeIcon}
              </button>
            )}
          </div>

          {/* Body */}
          <div className={styles.body}>{children}</div>

          {/* Footer (optional) */}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>,
      document.body
    );
  }
);

Modal.displayName = 'Modal';

export default React.memo(Modal);