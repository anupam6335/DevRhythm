'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronDown, FiRefreshCw } from 'react-icons/fi';
import SearchBar from '@/shared/components/SearchBar';
import styles from './FilterPanel.module.css';

export interface SortItem {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterState {
  sorts: SortItem[];
}

interface FilterPanelProps {
  onFiltersChange: (filters: FilterState) => void;
  onSearchChange: (search: string) => void;
  isAuthenticated: boolean;
  initialSorts?: SortItem[];
}

const SORT_OPTIONS = [
  { value: 'totalSolved', label: 'Total Solved' },
  { value: 'masteryRate', label: 'Mastery' },
  { value: 'totalTimeSpent', label: 'Time Spent' },
];

const SHOW_OPTIONS = [
  { value: 'iFollow', label: 'I Follow', dynamic: true },
  { value: 'followsMe', label: 'Follows Me', dynamic: true },
  { value: 'mutualFriends', label: 'Mutual', dynamic: true },
];

const DYNAMIC_FIELDS = new Set(['iFollow', 'followsMe', 'mutualFriends']);
const MAX_SORTS = 5;

export default function FilterPanel({
  onFiltersChange,
  onSearchChange,
  isAuthenticated,
  initialSorts = [{ field: 'totalSolved', order: 'desc' }],
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [sorts, setSorts] = useState<SortItem[]>(initialSorts);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sticky scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          panelRef.current?.classList.add(styles.sticky);
          setExpanded(false);
        } else {
          panelRef.current?.classList.remove(styles.sticky);
        }
      },
      { threshold: [0] }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // Notify parent when sorts change
  useEffect(() => {
    onFiltersChange({ sorts });
  }, [sorts, onFiltersChange]);

  const ensureDynamicFirst = (items: SortItem[]): SortItem[] => {
    const dynamicIndex = items.findIndex(s => DYNAMIC_FIELDS.has(s.field));
    if (dynamicIndex <= 0) return items;
    const dynamicItem = items[dynamicIndex];
    const rest = items.filter((_, i) => i !== dynamicIndex);
    return [dynamicItem, ...rest];
  };

  const updateSorts = (newSorts: SortItem[]) => {
    if (newSorts.length > MAX_SORTS) return;
    const reordered = ensureDynamicFirst(newSorts);
    setSorts(reordered);
  };

  const toggleSortField = (field: string) => {
    const exists = sorts.some(s => s.field === field);
    if (exists) {
      const newSorts = sorts.filter(s => s.field !== field);
      if (newSorts.length === 0) {
        updateSorts([{ field: 'totalSolved', order: 'desc' }]);
      } else {
        updateSorts(newSorts);
      }
    } else {
      if (sorts.length >= MAX_SORTS) return;
      updateSorts([...sorts, { field, order: 'desc' }]);
    }
  };

  const toggleSortOrder = (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateSorts(
      sorts.map(s =>
        s.field === field ? { ...s, order: s.order === 'asc' ? 'desc' : 'asc' } : s
      )
    );
  };

  const handleShowFilter = (field: string) => {
    updateSorts([{ field, order: 'desc' }]);
  };

  const handleReset = () => {
    updateSorts([{ field: 'totalSolved', order: 'desc' }]);
  };

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    onSearchChange(query);
  }, [onSearchChange]);

  const isSortActive = (field: string) => sorts.some(s => s.field === field);
  const getSortOrder = (field: string) => sorts.find(s => s.field === field)?.order;

  const activeDynamicField = sorts.find(s => DYNAMIC_FIELDS.has(s.field))?.field;

  const handleHeaderClick = () => {
    const isSticky = panelRef.current?.classList.contains(styles.sticky);
    if (isSticky) {
      panelRef.current?.classList.remove(styles.sticky);
      const sentinel = sentinelRef.current;
      if (sentinel) {
        const navbarHeight = 80;
        const elementPosition = sentinel.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarHeight;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      setTimeout(() => setExpanded(true), 400);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <div ref={sentinelRef} className={styles.sentinel} />
      <div ref={panelRef} className={`${styles.filterPanel} ${expanded ? styles.expanded : ''}`}>
        <div className={styles.filterHeader} onClick={handleHeaderClick}>
          <div className={styles.filterTitle}>🔍 Refine your circle</div>
          <span className={styles.filterToggle}>▼</span>
        </div>
        <div className={styles.filterBody}>
          <div className={styles.filterBodyInner}>
            {/* Search row */}
            <div className={styles.searchRow}>
              <SearchBar
                placeholder="Username or display name..."
                initialValue={search}
                onSearch={handleSearch}
                clearable
                debounceMs={300}
                ariaLabel="Search users"
              />
            </div>

            {/* Sort row */}
            <div className={styles.sortRow}>
              <span className={styles.rowLabel}>Sort:</span>
              <div className={styles.chipsRow}>
                {SORT_OPTIONS.map(opt => {
                  const active = isSortActive(opt.value);
                  const order = getSortOrder(opt.value);
                  const disabled = !!activeDynamicField && activeDynamicField !== opt.value && !active;
                  return (
                    <button
                      key={opt.value}
                      className={`${styles.sortChip} ${active ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
                      onClick={() => !disabled && toggleSortField(opt.value)}
                      disabled={disabled}
                    >
                      <span>{opt.label}</span>
                      {active && (
                        <span
                          className={styles.arrow}
                          onClick={e => toggleSortOrder(opt.value, e)}
                          aria-label="Toggle order"
                        >
                          {order === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button className={styles.resetBtn} onClick={handleReset} aria-label="Reset sorting">
                <FiRefreshCw size={14} />
                <span>Reset</span>
              </button>
            </div>

            {/* Show row (dynamic filters) */}
            {isAuthenticated && (
              <div className={styles.showRow}>
                <span className={styles.rowLabel}>Show:</span>
                <div className={styles.chipsRow}>
                  {SHOW_OPTIONS.map(opt => {
                    const active = activeDynamicField === opt.value;
                    return (
                      <button
                        key={opt.value}
                        className={`${styles.showChip} ${active ? styles.active : ''}`}
                        onClick={() => handleShowFilter(opt.value)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.scrollDepthOverlay} />
    </>
  );
}