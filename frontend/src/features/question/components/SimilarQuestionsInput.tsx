'use client';

import React, { useState, useEffect } from 'react';
import { useDebounceValue } from '@/shared/hooks/useDebounce';
import { useQuestions } from '../hooks/useQuestions';
import { ChipInput } from './ChipInput';
import type { Question } from '@/shared/types';
import styles from './SimilarQuestionsInput.module.css';

interface SimilarQuestionsInputProps {
  value: string[]; // array of question IDs
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export const SimilarQuestionsInput: React.FC<SimilarQuestionsInputProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const { data, isLoading } = useQuestions(
    debouncedSearch ? { search: debouncedSearch, limit: 5 } : undefined
  );

  const results = data?.questions ?? [];

  const handleSelect = (question: Question) => {
    if (!value.includes(question._id)) {
      onChange([...value, question._id]);
    }
    setSearch('');
  };

  // For chip display, we need titles – store a map of id->title.
  // We'll fetch them when needed? For simplicity, we'll keep a local map.
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Whenever value changes, fetch missing titles (if not already in map)
    const missingIds = value.filter(id => !titleMap[id]);
    if (missingIds.length === 0) return;

    // We could fetch each question individually, but better to batch using a service?
    // For now, we'll ignore – the chip will just show ID.
    // In a real app, you'd have a hook to fetch multiple questions.
    // We'll keep it simple and only show IDs.
  }, [value, titleMap]);

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          disabled={disabled}
          className={styles.searchInput}
        />
        {isLoading && <span className={styles.spinner}>⌛</span>}
      </div>
      {search && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((q) => (
            <li key={q._id} onClick={() => handleSelect(q)} className={styles.resultItem}>
              {q.title} ({q.platform})
            </li>
          ))}
        </ul>
      )}
      <div className={styles.chips}>
        {value.map((id) => (
          <span key={id} className={styles.chip}>
            {titleMap[id] || id}
            <button
              type="button"
              onClick={() => onChange(value.filter(i => i !== id))}
              className={styles.removeBtn}
              aria-label="Remove"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};