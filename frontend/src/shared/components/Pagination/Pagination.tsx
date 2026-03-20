"use client";

import React, { useCallback, useMemo } from 'react';
import {
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from 'react-icons/fa';
import clsx from 'clsx';
import styles from './Pagination.module.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ref?: React.Ref<HTMLElement>;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',
  className,
  ref,
}) => {
  // Memoize page numbers generation
  const pages = useMemo(() => {
    if (totalPages <= 1) return [];

    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
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
  }, [currentPage, totalPages, siblingCount]);

  const handlePageClick = useCallback(
    (page: number) => {
      if (page !== currentPage) onPageChange(page);
    },
    [currentPage, onPageChange]
  );

  const handlePrev = useCallback(() => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }, [currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }, [currentPage, totalPages, onPageChange]);

  const handleFirst = useCallback(() => onPageChange(1), [onPageChange]);
  const handleLast = useCallback(() => onPageChange(totalPages), [onPageChange, totalPages]);

  if (totalPages <= 1) return null;

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
              <span className={clsx(styles.ellipsis, buttonSizeClass)} aria-hidden="true">
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
};

Pagination.displayName = 'Pagination';

export default React.memo(Pagination);