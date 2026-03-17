'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useDebounceValue, useClickOutside } from '@/shared/hooks';
import { useLeetCodeSearch } from '../hooks/useLeetCodeSearch';
import Loader from '@/shared/components/Loader';
import clsx from 'clsx';
import styles from './LeetCodeSearch.module.css';

interface LeetCodeSearchProps {
  onSelect: (result: { title: string; slug: string; difficulty: string; tags: string[]; url: string }) => void;
}

export const LeetCodeSearch: React.FC<LeetCodeSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounceValue(query, 300);

  const { data, isLoading, error } = useLeetCodeSearch(debouncedQuery, 'name');
  const results = data?.results ?? [];

  useClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return styles.easy;
      case 'medium': return styles.medium;
      case 'hard': return styles.hard;
      default: return '';
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or tag..."
          className={styles.input}
        />
        {isLoading && <Loader size="sm" className={styles.spinner} />}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.slug}
                type="button"
                className={styles.resultItem}
                onClick={() => {
                  onSelect(result);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <span className={styles.resultTitle}>{result.title}</span>
                <div className={styles.resultMeta}>
                  <span className={clsx(styles.difficultyPill, getDifficultyColor(result.difficulty))}>
                    {result.difficulty}
                  </span>
                  {result.tags.length > 0 && (
                    <div className={styles.tags}>
                      {result.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                      {result.tags.length > 3 && (
                        <span className={styles.tag}>+{result.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            !isLoading && debouncedQuery.length >= 2 && (
              <div className={styles.noResults}>No matching problems found.</div>
            )
          )}
          {error && <div className={styles.error}>Search failed. Please try again.</div>}
        </div>
      )}
    </div>
  );
};