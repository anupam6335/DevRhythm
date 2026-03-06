'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { IoSearch, IoClose } from 'react-icons/io5';
import { ImSpinner8 } from 'react-icons/im';
import { useDebounceCallback, useClickOutside } from '@/shared/hooks';
import Input from '@/shared/components/Input';
import Button from '@/shared/components/Button';
import clsx from 'clsx';
import styles from './SearchBar.module.css';

export interface SuggestionItem {
  id: string | number;
  label: string;
  [key: string]: any;
}

export interface SearchBarProps {
  /** Callback triggered when the user performs a search (after debounce or on submit) */
  onSearch: (query: string) => void;
  /** Optional callback for immediate input changes (e.g., for suggestions) */
  onChange?: (query: string) => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Initial search query (uncontrolled) */
  initialValue?: string;
  /** Controlled value (if provided, component becomes controlled) */
  value?: string;
  /** Debounce delay in ms (0 to disable and search only on Enter) */
  debounceMs?: number;
  /** Whether a loading indicator is shown (e.g., while fetching results) */
  isLoading?: boolean;
  /** Whether to show a clear button when the input has a value */
  clearable?: boolean;
  /** Additional CSS class for the form element */
  className?: string;
  /** Accessible label for the input */
  ariaLabel?: string;
  /** Error state passed to the underlying Input */
  error?: boolean;
  /** Disabled state passed to the underlying Input */
  disabled?: boolean;
  /** Whether clearing the input should trigger onSearch('') (default: true) */
  clearTriggersSearch?: boolean;
  /** Whether selecting a suggestion should fill the input with its label (default: true) */
  fillInputOnSelect?: boolean;
  /** Whether selecting a suggestion should also trigger onSearch (default: false) */
  searchOnSelect?: boolean;

  // Suggestions features
  /** Array of suggestion items to display in dropdown */
  suggestions?: SuggestionItem[];
  /** Custom render function for each suggestion (optional) */
  renderSuggestion?: (item: SuggestionItem, isSelected: boolean) => React.ReactNode;
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (item: SuggestionItem) => void;
  /** Message to show when no results found */
  noResultsMessage?: string;
  /** Maximum number of suggestions to display */
  maxSuggestions?: number;
  /** Whether to show the dropdown when input is focused (even with empty query) */
  showOnFocus?: boolean;
}

export interface SearchBarRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  input: HTMLInputElement | null;
}

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({
  onSearch,
  onChange,
  placeholder = 'Search...',
  initialValue = '',
  value: controlledValue,
  debounceMs = 300,
  isLoading = false,
  clearable = true,
  className,
  ariaLabel = 'Search',
  error = false,
  disabled = false,
  clearTriggersSearch = true,
  fillInputOnSelect = true,
  searchOnSelect = false,
  suggestions,
  renderSuggestion,
  onSuggestionSelect,
  noResultsMessage = 'No results found',
  maxSuggestions = 10,
  showOnFocus = false,
}, ref) => {
  // Determine if component is controlled
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(initialValue);
  const inputValue = isControlled ? controlledValue : internalValue;

  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Flag to prevent auto‑reopening right after a suggestion is selected
  const disableAutoOpenRef = useRef(false);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => handleClear(),
    input: inputRef.current,
  }));

  // Close dropdown when clicking outside
  useClickOutside(containerRef, () => setIsOpen(false));

  // Debounced search
  const debouncedSearch = useDebounceCallback(
    (query: string) => {
      onSearch(query);
    },
    debounceMs
  );

  // Update internal value when initialValue changes (only for uncontrolled)
  useEffect(() => {
    if (!isControlled) {
      setInternalValue(initialValue);
    }
  }, [initialValue, isControlled]);

  // Manage dropdown open state based on focus, input value, and suggestions
  useEffect(() => {
    if (!isFocused) {
      setIsOpen(false);
      return;
    }

    // If we just selected a suggestion, keep dropdown closed until user types again
    if (disableAutoOpenRef.current) {
      return;
    }

    const hasNonEmptyInput = inputValue.trim() !== '';
    const hasSuggestions = suggestions && suggestions.length > 0;

    if (hasNonEmptyInput && hasSuggestions) {
      setIsOpen(true);
    } else if (showOnFocus && isFocused) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isFocused, inputValue, suggestions, showOnFocus]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // User is typing – re‑enable auto‑open
    disableAutoOpenRef.current = false;

    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);

    if (debounceMs > 0) {
      debouncedSearch(newValue);
    }

    setSelectedIndex(-1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
    setIsOpen(false);
  };

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    if (clearTriggersSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
    setIsOpen(false);
    disableAutoOpenRef.current = false; // clearing is like a new start
  }, [isControlled, onChange, clearTriggersSearch, onSearch]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || !suggestions?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < Math.min(suggestions.length, maxSuggestions) - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSuggestionSelect = (item: SuggestionItem) => {
    onSuggestionSelect?.(item);

    if (fillInputOnSelect) {
      const newValue = item.label;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }

    if (searchOnSelect) {
      onSearch(fillInputOnSelect ? item.label : inputValue);
    }

    setIsOpen(false);
    disableAutoOpenRef.current = true; // prevent dropdown from reopening immediately
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  // Prepare suggestions to display (limit)
  const displayedSuggestions = suggestions?.slice(0, maxSuggestions) || [];
  const showNoResults =
    suggestions &&
    inputValue.trim() !== '' &&
    displayedSuggestions.length === 0 &&
    !isLoading;

  const showRightSlot = (clearable && inputValue && !isLoading) || isLoading;

  // Default suggestion renderer with theme‑aware search icon
  const defaultRenderSuggestion = (item: SuggestionItem, isSelected: boolean) => (
    <div className={styles.suggestionContent}>
      <IoSearch className={styles.suggestionIcon} />
      <span className={clsx(styles.suggestionLabel, isSelected && styles.selectedLabel)}>
        {item.label}
      </span>
    </div>
  );

  return (
    <div ref={containerRef} className={clsx(styles.searchBar, className)}>
      <form onSubmit={handleSubmit} role="search">
        <div className={styles.inputWrapper}>
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            leftIcon={<IoSearch />}
            error={error}
            disabled={disabled}
            fullWidth
            aria-label={ariaLabel}
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="search-suggestions"
            className={clsx(showRightSlot && styles.inputWithRightSlot)}
          />

          {showRightSlot && (
            <div className={styles.rightSlot}>
              {isLoading ? (
                <ImSpinner8 className={styles.loadingSpinner} aria-label="Loading" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<IoClose />}
                  onClick={handleClear}
                  aria-label="Clear search"
                  className={styles.clearButton}
                />
              )}
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (displayedSuggestions.length > 0 || showNoResults) && (
        <div
          id="search-suggestions"
          ref={dropdownRef}
          className={styles.dropdown}
          role="listbox"
          aria-label="Search suggestions"
        >
          {displayedSuggestions.map((item, index) => (
            <div
              key={item.id}
              className={clsx(styles.suggestionItem, {
                [styles.selected]: index === selectedIndex,
              })}
              onClick={() => handleSuggestionSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {renderSuggestion
                ? renderSuggestion(item, index === selectedIndex)
                : defaultRenderSuggestion(item, index === selectedIndex)}
            </div>
          ))}
          {showNoResults && (
            <div className={styles.noResults} role="status">
              {noResultsMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;