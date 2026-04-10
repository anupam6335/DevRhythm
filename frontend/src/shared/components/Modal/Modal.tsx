"use client";

import React, { useEffect, useRef, useCallback, useId, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import clsx from 'clsx';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  describedBy?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  closeIcon?: React.ReactNode;
  onCloseAttempt?: (event: { source: 'escape' | 'backdrop' | 'closeButton' }) => boolean | void;
  className?: string;
  overlayClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  preventScroll?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

let modalStack = 0;

const Modal: React.FC<ModalProps> = ({
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
  ref: forwardedRef,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const titleId = useId();

  const handleClose = useCallback(() => {
    const shouldClose = onCloseAttempt?.({ source: 'closeButton' }) !== false;
    if (shouldClose) onClose();
  }, [onClose, onCloseAttempt]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && event.target === overlayRef.current) {
        const shouldClose = onCloseAttempt?.({ source: 'backdrop' }) !== false;
        if (shouldClose) onClose();
      }
    },
    [closeOnBackdropClick, onClose, onCloseAttempt]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        const shouldClose = onCloseAttempt?.({ source: 'escape' }) !== false;
        if (shouldClose) onClose();
      }
    },
    [closeOnEsc, isOpen, onClose, onCloseAttempt]
  );

  // Scroll lock effect
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

  // Escape key listener
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
        if (isAnimatingOut) setIsAnimatingOut(false);
      }}
      role="presentation"
    >
      <div
        ref={(node) => {
          modalRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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
              onClick={handleClose}
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
};

Modal.displayName = 'Modal';

export default memo(Modal);