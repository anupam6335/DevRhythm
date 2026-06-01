'use client';

import { useState } from 'react';
import { useQuestionSearch } from '@/features/question';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import Button from '@/shared/components/Button';
import Loader from '@/shared/components/Loader';
import styles from './QuestionSearchList.module.css';

interface QuestionSearchListProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export default function QuestionSearchList({ selectedIds, onChange, disabled }: QuestionSearchListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuestionSearch(debouncedTerm, debouncedTerm.length >= 2);

  const questions = data?.questions || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    const timer = setTimeout(() => setDebouncedTerm(value), 300);
    return () => clearTimeout(timer);
  };

  const addQuestion = (questionId: string) => {
    if (!selectedIds.includes(questionId)) {
      onChange([...selectedIds, questionId]);
    }
    setSearchTerm('');
    setDebouncedTerm('');
    setIsOpen(false);
  };

  const removeQuestion = (questionId: string) => {
    onChange(selectedIds.filter(id => id !== questionId));
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <div className={styles.searchInputWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            placeholder="Search questions by title or ID..."
            disabled={disabled}
            className={styles.searchInput}
          />
          {isLoading && <Loader size="sm" className={styles.spinner} />}
        </div>
        {isOpen && debouncedTerm.length >= 2 && (
          <div className={styles.dropdown}>
            {questions.length === 0 && !isLoading && (
              <div className={styles.noResults}>No questions found</div>
            )}
            {questions.map((q: any) => (
              <button
                key={q._id}
                type="button"
                className={styles.resultItem}
                onClick={() => addQuestion(q._id)}
                disabled={selectedIds.includes(q._id)}
              >
                <span className={styles.resultTitle}>{q.title}</span>
                <span className={styles.resultId}>{q.platformQuestionId}</span>
                <Button variant="ghost" size="sm" leftIcon={<FiPlus />} disabled={selectedIds.includes(q._id)} />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.selectedSection}>
        <div className={styles.selectedHeader}>
          Selected Questions ({selectedIds.length})
        </div>
        {selectedIds.length === 0 && (
          <div className={styles.emptySelected}>No questions selected</div>
        )}
        <div className={styles.selectedList}>
          {selectedIds.map(id => {
            // We need to display title, but we only have ID. For simplicity, we'll show ID.
            // In production, we would store the full question object or fetch titles.
            // For now, we show the ID (or a placeholder). We'll improve by storing question objects.
            return (
              <div key={id} className={styles.selectedItem}>
                <span className={styles.selectedId}>{id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuestion(id)}
                  leftIcon={<FiX />}
                  className={styles.removeBtn}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}