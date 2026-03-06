// src/app/test/multiple/page.tsx
'use client';

import React, { useState } from 'react';
import Radio from '@/shared/components/Radio';
import Select from '@/shared/components/Select';
import SortDropdown from '@/shared/components/SortDropdown';
import FilterChip from '@/shared/components/FilterChip';
import PlatformIcon from '@/shared/components/PlatformIcon';
import styles from './page.module.css'; // optional local styles

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'name', label: 'Name' },
];

const filterChipOptions = [
  { label: 'All', count: 42 },
  { label: 'Solved', count: 18 },
  { label: 'Attempted', count: 7 },
  { label: 'Bookmarked', count: 5 },
];

const platforms = [
  'LeetCode',
  'HackerRank',
  'Codeforces',
  'GeeksForGeeks',
  'Unknown',
];

export default function TestMultiplePage() {
  const [radioValue, setRadioValue] = useState('option1');
  const [selectValue, setSelectValue] = useState('');
  const [sortValue, setSortValue] = useState('newest');
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['All']);

  const radioOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const selectOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
  ];

  const handleFilterClick = (label: string) => {
    setSelectedFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  return (
    <div className={styles.container}>
      <h1>Component Test Page</h1>

      <section className={styles.section}>
        <h2>Radio Group</h2>
        <Radio
          name="testRadio"
          options={radioOptions}
          value={radioValue}
          onChange={setRadioValue}
        />
        <p>Selected: {radioValue}</p>

        <h3>Horizontal</h3>
        <Radio
          name="testRadioHorizontal"
          options={radioOptions}
          value={radioValue}
          onChange={setRadioValue}
          orientation="horizontal"
        />
      </section>

      <section className={styles.section}>
        <h2>Select</h2>
        <Select
          options={selectOptions}
          value={selectValue}
          onChange={setSelectValue}
          placeholder="Choose a fruit"
        />
        <p>Selected: {selectValue || 'none'}</p>

        <h3>With error state</h3>
        <Select
          options={selectOptions}
          value={selectValue}
          onChange={setSelectValue}
          error
          placeholder="Error example"
        />

        <h3>Disabled</h3>
        <Select
          options={selectOptions}
          value={selectValue}
          onChange={setSelectValue}
          disabled
          placeholder="Disabled"
        />
      </section>

      <section className={styles.section}>
        <h2>SortDropdown</h2>
        <SortDropdown
          options={sortOptions}
          value={sortValue}
          onChange={setSortValue}
          label="Sort by"
        />
        <p>Selected sort: {sortValue}</p>
      </section>

      <section className={styles.section}>
        <h2>FilterChip</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {filterChipOptions.map((chip) => (
            <FilterChip
              key={chip.label}
              label={chip.label}
              count={chip.count}
              selected={selectedFilters.includes(chip.label)}
              onClick={() => handleFilterClick(chip.label)}
            />
          ))}
        </div>
        <p>Selected filters: {selectedFilters.join(', ') || 'none'}</p>

        <h3>Disabled chip</h3>
        <FilterChip label="Disabled" count={3} disabled />
      </section>

      <section className={styles.section}>
        <h2>PlatformIcon</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {platforms.map((platform) => (
            <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <PlatformIcon platform={platform} size="md" />
              <span>{platform}</span>
            </div>
          ))}
        </div>

        <h3>Different sizes</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <PlatformIcon platform="LeetCode" size="sm" />
          <PlatformIcon platform="LeetCode" size="md" />
          <PlatformIcon platform="LeetCode" size="lg" />
          <PlatformIcon platform="LeetCode" size={48} />
        </div>
      </section>
    </div>
  );
}