'use client';

import React, { useRef, useState } from 'react';
import SearchBar, { SearchBarRef, SuggestionItem } from '@/shared/components/SearchBar';
import Checkbox from '@/shared/components/Checkbox';
import ThemeToggle from '@/shared/components/ThemeToggle';

// Mock suggestion data
const mockSuggestions: SuggestionItem[] = [
  { id: 1, label: 'React' },
  { id: 2, label: 'React Hooks' },
  { id: 3, label: 'React Router' },
  { id: 4, label: 'Redux' },
  { id: 5, label: 'TypeScript' },
  { id: 6, label: 'Next.js' },
  { id: 7, label: 'Tailwind CSS' },
  { id: 8, label: 'GraphQL' },
  { id: 9, label: 'Node.js' },
  { id: 10, label: 'Express' },
  { id: 11, label: 'MongoDB' },
  { id: 12, label: 'PostgreSQL' },
  { id: 13, label: 'Docker' },
  { id: 14, label: 'Kubernetes' },
  { id: 15, label: 'AWS' },
  { id: 16, label: 'AWS ii' },
];

// Filter suggestions based on input
const filterSuggestions = (query: string): SuggestionItem[] => {
  if (!query.trim()) return [];
  return mockSuggestions.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );
};

export default function SearchBarTestPage() {
  // Basic example
  const [basicResult, setBasicResult] = useState<string | null>(null);

  // Suggestions example
  const [suggestionsQuery, setSuggestionsQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionItem | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [fillInput, setFillInput] = useState(true);
  const [clearTriggersSearch, setClearTriggersSearch] = useState(true);
  const [searchOnSelect, setSearchOnSelect] = useState(false);
  const [lastSearch, setLastSearch] = useState<string | null>(null);

  // Controlled example
  const [controlledValue, setControlledValue] = useState('');

  // Ref example
  const searchBarRef = useRef<SearchBarRef>(null);
  const [refMessage, setRefMessage] = useState('');

  const handleBasicSearch = (query: string) => setBasicResult(query);

  const handleSuggestionsChange = (query: string) => {
    setSuggestionsQuery(query);
    if (query.trim()) {
      setSuggestionsLoading(true);
      setTimeout(() => {
        setSuggestions(filterSuggestions(query));
        setSuggestionsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setSuggestionsLoading(false);
    }
  };

  const handleSuggestionSelect = (item: SuggestionItem) => {
    setSelectedSuggestion(item);
  };

  const handleSearch = (query: string) => {
    setLastSearch(query);
    console.log('Search:', query);
  };

  const handleFocusClick = () => {
    searchBarRef.current?.focus();
    setRefMessage('Input focused');
  };

  const handleClearClick = () => {
    searchBarRef.current?.clear();
    setRefMessage('Input cleared');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h1>SearchBar Component Test Page</h1>
      <p>Demonstrates all major features of the reusable SearchBar.</p>

      <hr style={{ margin: '2rem 0' }} />
        <ThemeToggle variant="both" label="Toggle theme" />

      {/* 1. Basic */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>1. Basic SearchBar</h2>
        <SearchBar onSearch={handleBasicSearch} placeholder="Search anything..." />
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Last searched:</strong> {basicResult ?? '(none)'}
        </div>
      </section>

      {/* 2. Suggestions with Configurable Options */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>2. Suggestions with Configurable Options</h2>
        <div
          style={{
            marginBottom: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <Checkbox
            checked={fillInput}
            onChange={setFillInput}
            label="fillInputOnSelect"
          />
          <Checkbox
            checked={clearTriggersSearch}
            onChange={setClearTriggersSearch}
            label="clearTriggersSearch"
          />
          <Checkbox
            checked={searchOnSelect}
            onChange={setSearchOnSelect}
            label="searchOnSelect"
          />
        </div>
        <SearchBar
          onSearch={handleSearch}
          onChange={handleSuggestionsChange}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={suggestions}
          isLoading={suggestionsLoading}
          debounceMs={300}
          placeholder="Type 're' or 'react'..."
          fillInputOnSelect={fillInput}
          clearTriggersSearch={clearTriggersSearch}
          searchOnSelect={searchOnSelect}
        />
        <div style={{ marginTop: '0.5rem' }}>
          <div>
            <strong>Selected suggestion:</strong> {selectedSuggestion?.label ?? '(none)'}
          </div>
          <div>
            <strong>Last search:</strong> {lastSearch ?? '(none)'}
          </div>
        </div>
      </section>

      {/* 3. Controlled Mode */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>3. Controlled Mode</h2>
        <SearchBar
          value={controlledValue}
          onSearch={(q) => console.log('Controlled search:', q)}
          onChange={setControlledValue}
          placeholder="Type here (controlled)"
        />
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <span>
            <strong>External value:</strong> {controlledValue}
          </span>
          <button onClick={() => setControlledValue('Next.js')}>
            Set to "Next.js"
          </button>
        </div>
      </section>

      {/* 4. Ref Methods */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>4. Ref Methods (focus, clear)</h2>
        <SearchBar
          ref={searchBarRef}
          onSearch={(q) => console.log('Ref search:', q)}
          placeholder="Use buttons to focus/clear"
        />
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleFocusClick}>Focus</button>
          <button onClick={handleClearClick}>Clear</button>
        </div>
        {refMessage && (
          <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{refMessage}</div>
        )}
      </section>

      {/* 5. Debounced Search */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>5. Debounced Search (500ms)</h2>
        <SearchBar onSearch={(q) => console.log('Debounced:', q)} debounceMs={500} />
      </section>

      {/* 6. Loading State */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>6. Loading State</h2>
        <SearchBar onSearch={() => {}} isLoading={true} placeholder="Loading indicator" />
      </section>

      {/* 7. Error State */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>7. Error State</h2>
        <SearchBar onSearch={() => {}} error={true} placeholder="Error styling" />
      </section>

      {/* 8. Disabled State */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>8. Disabled State</h2>
        <SearchBar onSearch={() => {}} disabled={true} initialValue="Can't type here" />
      </section>

      {/* 9. Clearable Control */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>9. Clearable Control</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <SearchBar onSearch={() => {}} placeholder="Clearable (default)" />
          <SearchBar onSearch={() => {}} clearable={false} placeholder="Non-clearable" />
        </div>
      </section>

      {/* 10. No Suggestions Dropdown */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>10. No Suggestions (showOnFocus)</h2>
        <SearchBar
          onSearch={() => {}}
          showOnFocus
          placeholder="Dropdown opens on focus (empty)"
        />
      </section>
    </div>
  );
}