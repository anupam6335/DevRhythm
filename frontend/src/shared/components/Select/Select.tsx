import React, { useState, useRef, useEffect, useId } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import clsx from 'clsx';
import { useClickOutside } from '@/shared/hooks';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  /** Array of options */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Disable the select */
  disabled?: boolean;
  /** Show error state */
  error?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * A custom, accessible dropdown select.
 * Uses a button to trigger the options list and supports keyboard navigation.
 */
export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  useClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(options.findIndex((opt) => opt.value === value));
      listRef.current?.focus();
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, options, value]);

  const handleToggle = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        styles.container,
        disabled && styles.disabled,
        error && styles.error,
        className
      )}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.button}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        id={`${id}-button`}
        disabled={disabled}
      >
        <span className={styles.value}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown
          className={clsx(styles.chevron, isOpen && styles.chevronOpen)}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className={styles.optionsList}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={
            focusedIndex >= 0 ? `${id}-option-${focusedIndex}` : undefined
          }
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={value === option.value}
              className={clsx(
                styles.option,
                value === option.value && styles.selected,
                focusedIndex === index && styles.focused
              )}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;