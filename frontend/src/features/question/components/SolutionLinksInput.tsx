'use client';

import React from 'react';
import { FaPlus, FaTrash, FaLink } from 'react-icons/fa';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import clsx from 'clsx';
import styles from './SolutionLinksInput.module.css';

interface SolutionLinksInputProps {
  value: string[];
  onChange: (links: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export const SolutionLinksInput: React.FC<SolutionLinksInputProps> = ({
  value,
  onChange,
  disabled,
  className,
}) => {
  const handleChange = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...value, '']);
  };

  return (
    <div className={clsx(styles.container, className)}>
      {value.map((link, index) => (
        <div key={index} className={styles.linkRow}>
          <div className={styles.linkInputWrapper}>
            <FaLink className={styles.linkIcon} />
            <Input
              type="url"
              value={link}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder="https://..."
              disabled={disabled}
              fullWidth
              className={styles.linkInput}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(index)}
            disabled={disabled}
            aria-label="Remove link"
            className={styles.removeButton}
          >
            <FaTrash />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={handleAdd}
        disabled={disabled}
        leftIcon={<FaPlus />}
        className={styles.addButton}
      >
        Add link
      </Button>
    </div>
  );
};