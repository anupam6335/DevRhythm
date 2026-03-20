'use client';

import React, { useState, KeyboardEvent } from 'react';
import { FaTimes } from 'react-icons/fa';
import clsx from 'clsx';
import Input from '@/shared/components/Input';
import styles from './ChipInput.module.css';

export interface ChipInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  max?: number;
  suggestions?: string[]; // optional suggestions (could be used for autocomplete)
}

export const ChipInput: React.FC<ChipInputProps> = ({
  value,
  onChange,
  placeholder = 'Type and press Enter...',
  className,
  disabled,
  max,
  suggestions,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  const addChip = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && (!max || value.length < max)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue.trim()) {
      addChip();
    }
  };

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.chipWrapper}>
        {value.map((chip, index) => (
          <span key={index} className={styles.chip}>
            {chip}
            <button
              type="button"
              onClick={() => removeChip(index)}
              className={styles.removeBtn}
              aria-label={`Remove ${chip}`}
            >
              <FaTimes />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || (max !== undefined && value.length >= max)}
          className={clsx(styles.input, disabled && styles.disabled)}
        />
      </div>
      {suggestions && isFocused && inputValue && (
        <div className={styles.suggestions}>
          {suggestions
            .filter((s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s))
            .slice(0, 5)
            .map((s) => (
              <button
                key={s}
                type="button"
                className={styles.suggestion}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents input blur
                  onChange([...value, s]);
                  setInputValue('');
                }}
              >
                {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};