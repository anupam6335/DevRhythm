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

// Global modal stack counter
let modalStack = 0;

/**
 * Modal component – accessible, animated, and fully customizable dialog.
 *
 * Features:
 * - Full accessibility (ARIA, focus trap, keyboard navigation)
 * - Smooth enter/exit animations (CSS transitions, respects prefers-reduced-motion)
 * - Body scroll lock with width compensation to prevent layout shift
 * - Stacked modal support (multiple modals open at once)
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

    // Scroll lock with width compensation
    useEffect(() => {
      if (!preventScroll) return;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      if (isOpen) {
        modalStack++;
        if (modalStack === 1) {
          previouslyFocusedElement.current = document.activeElement as HTMLElement;
          document.body.style.overflow = 'hidden';
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
      } else {
        modalStack = Math.max(0, modalStack - 1);
        if (modalStack === 0) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
      }

      return () => {
        if (preventScroll && modalStack > 0) {
          modalStack--;
          if (modalStack === 0) {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
          }
        }
      };
    }, [isOpen, preventScroll]);

    // Focus trap and initial focus
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

      setFocus();
    }, [isOpen, initialFocusRef]);

    // Handle Escape key with potential prevention
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (closeOnEsc && event.key === 'Escape' && isOpen) {
          const shouldClose = onCloseAttempt?.({ source: 'escape' }) !== false;
          if (shouldClose) {
            onClose();
          }
        }
      },
      [closeOnEsc, isOpen, onClose, onCloseAttempt]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
      } else {
        document.removeEventListener('keydown', handleKeyDown);
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, handleKeyDown]);

    // Handle backdrop click
    const handleOverlayClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (closeOnBackdropClick && event.target === overlayRef.current) {
          const shouldClose = onCloseAttempt?.({ source: 'backdrop' }) !== false;
          if (shouldClose) {
            onClose();
          }
        }
      },
      [closeOnBackdropClick, onClose, onCloseAttempt]
    );

    // Handle close button click
    const handleCloseButtonClick = useCallback(() => {
      const shouldClose = onCloseAttempt?.({ source: 'closeButton' }) !== false;
      if (shouldClose) {
        onClose();
      }
    }, [onClose, onCloseAttempt]);

    // Return focus when closed
    useEffect(() => {
      if (!isOpen) {
        const target = returnFocusRef?.current || previouslyFocusedElement.current;
        if (target && document.contains(target) && typeof target.focus === 'function') {
          target.focus();
        }
      }
    }, [isOpen, returnFocusRef]);

    if (!isOpen && !isAnimatingOut) return null;

    return createPortal(
      <div
        ref={overlayRef}
        className={clsx(styles.overlay, overlayClassName, {
          [styles.overlayClosing]: isAnimatingOut,
        })}
        onClick={handleOverlayClick}
        onAnimationEnd={() => {
          if (isAnimatingOut) {
            setIsAnimatingOut(false);
          }
        }}
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
          <div className={styles.body}>
            {children}
          </div>

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