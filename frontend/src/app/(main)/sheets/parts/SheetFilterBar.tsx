'use client';

import { useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import SearchBar from '@/shared/components/SearchBar';
import Select from '@/shared/components/Select';
import SortDropdown from '@/shared/components/SortDropdown';
import clsx from 'clsx';
import styles from './SheetFilterBar.module.css';

interface SheetFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  ownerFilter: 'all' | 'mine';
  onOwnerFilterChange: (value: 'all' | 'mine') => void;
  sortBy: 'createdAt' | 'name' | 'updatedAt';
  onSortByChange: (value: 'createdAt' | 'name' | 'updatedAt') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  isLoggedIn: boolean;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest' },
  { value: 'createdAt_asc', label: 'Oldest' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

const OWNER_OPTIONS = [
  { value: 'all', label: 'All Sheets' },
  { value: 'mine', label: 'My Sheets' },
];

export default function SheetFilterBar({
  search,
  onSearchChange,
  ownerFilter,
  onOwnerFilterChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  isLoggedIn,
  className,
}: SheetFilterBarProps) {
  const handleSortChange = useCallback((selectedValue: string) => {
    const [newSortBy, newSortOrder] = selectedValue.split('_');
    onSortByChange(newSortBy as 'createdAt' | 'name' | 'updatedAt');
    onSortOrderChange(newSortOrder as 'asc' | 'desc');
  }, [onSortByChange, onSortOrderChange]);

  const currentSortValue = `${sortBy}_${sortOrder}`;

  return (
    <div className={clsx(styles.filterBar, className)}>
      <div className={styles.searchWrapper}>
        <SearchBar
          value={search}
          onChange={onSearchChange}
          onSearch={onSearchChange}
          placeholder="Search sheets..."
          debounceMs={300}
          clearable
          ariaLabel="Search sheets"
          className={styles.searchBar}
        />
      </div>

      <div className={styles.filterControls}>
        {isLoggedIn && (
          <Select
            value={ownerFilter}
            onChange={(value) => onOwnerFilterChange(value as 'all' | 'mine')}
            options={OWNER_OPTIONS}
            className={styles.filterSelect}
            aria-label="Filter by owner"
          />
        )}

        <SortDropdown
          options={SORT_OPTIONS}
          value={currentSortValue}
          onChange={handleSortChange}
          label="Sort by"
          className={styles.sortDropdown}
        />
      </div>
    </div>
  );
}