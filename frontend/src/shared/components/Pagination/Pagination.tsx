"use client";

import React from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from 'react-icons/fa';
import clsx from 'clsx';
import styles from './Pagination.module.css';

export interface PaginationProps {
  /** Current active page (1‑indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes, receives new page number */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show on each side of the current page */
  siblingCount?: number;
  /** Whether to show first/last buttons */
  showFirstLast?: boolean;
  /** Whether to show previous/next buttons */
  showPrevNext?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS class */
  className?: string;
}

/**
 * Pagination component – displays page navigation controls.
 * Renders nothing when totalPages <= 1.
 */
const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      currentPage,
      totalPages,
      onPageChange,
      siblingCount = 1,
      showFirstLast = true,
      showPrevNext = true,
      size = 'md',
      className,
    },
    ref
  ) => {
    // Don't render if only one page
    if (totalPages <= 1) return null;

    // Generate array of page numbers to display, using -1 for ellipsis
    const generatePages = () => {
      const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
      const totalBlocks = totalNumbers + 2; // including ellipsis blocks

      if (totalPages <= totalBlocks) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftEllipsis = leftSiblingIndex > 2;
      const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

      if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
        const leftRange = Array.from(
          { length: 3 + 2 * siblingCount },
          (_, i) => i + 1
        );
        return [...leftRange, -1, totalPages];
      }

      if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
        const rightRange = Array.from(
          { length: 3 + 2 * siblingCount },
          (_, i) => totalPages - (3 + 2 * siblingCount) + i + 1
        );
        return [1, -1, ...rightRange];
      }

      if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
        const middleRange = Array.from(
          { length: rightSiblingIndex - leftSiblingIndex + 1 },
          (_, i) => leftSiblingIndex + i
        );
        return [1, -1, ...middleRange, -1, totalPages];
      }

      return [];
    };

    const pages = generatePages();

    const handlePageClick = (page: number) => {
      if (page !== currentPage) onPageChange(page);
    };

    const handlePrev = () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    const handleFirst = () => onPageChange(1);
    const handleLast = () => onPageChange(totalPages);

    const buttonSizeClass = styles[size];

    return (
      <nav
        ref={ref}
        className={clsx(styles.pagination, className)}
        aria-label="Pagination"
      >
        <ul className={styles.list}>
          {showFirstLast && (
            <li>
              <button
                onClick={handleFirst}
                disabled={currentPage === 1}
                className={clsx(styles.button, buttonSizeClass, styles.firstLast)}
                aria-label="Go to first page"
              >
                <FaAngleDoubleLeft />
              </button>
            </li>
          )}
          {showPrevNext && (
            <li>
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={clsx(styles.button, buttonSizeClass, styles.prevNext)}
                aria-label="Go to previous page"
              >
                <FaChevronLeft />
              </button>
            </li>
          )}
          {pages.map((page, index) =>
            page === -1 ? (
              <li key={`ellipsis-${index}`}>
                <span
                  className={clsx(styles.ellipsis, buttonSizeClass)}
                  aria-hidden="true"
                >
                  …
                </span>
              </li>
            ) : (
              <li key={page}>
                <button
                  onClick={() => handlePageClick(page)}
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={clsx(
                    styles.button,
                    buttonSizeClass,
                    styles.pageButton,
                    page === currentPage && styles.active
                  )}
                >
                  {page}
                </button>
              </li>
            )
          )}
          {showPrevNext && (
            <li>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={clsx(styles.button, buttonSizeClass, styles.prevNext)}
                aria-label="Go to next page"
              >
                <FaChevronRight />
              </button>
            </li>
          )}
          {showFirstLast && (
            <li>
              <button
                onClick={handleLast}
                disabled={currentPage === totalPages}
                className={clsx(styles.button, buttonSizeClass, styles.firstLast)}
                aria-label="Go to last page"
              >
                <FaAngleDoubleRight />
              </button>
            </li>
          )}
        </ul>
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;