"use client";

import { useState } from 'react';
import Pagination from '@/shared/components/Pagination';
import Button from '@/shared/components/Button';
import ThemeToggle from '@/shared/components/ThemeToggle';
import CodeBlock from '@/shared/components/CodeBlock';
import {
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from 'react-icons/fa';

export default function PaginationTestPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [siblingCount, setSiblingCount] = useState(1);
  const [showFirstLast, setShowFirstLast] = useState(true);
  const [showPrevNext, setShowPrevNext] = useState(true);
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [lastAction, setLastAction] = useState('');

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLastAction(`Page changed to ${page}`);
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
          Pagination – Interactive Test Page
        </h1>
        <ThemeToggle variant="both" label="Toggle theme" />
      </div>

      {/* Controls */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Controls</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Current page */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Current Page
            </label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Total pages */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Total Pages
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={totalPages}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1) {
                  setTotalPages(val);
                  if (currentPage > val) setCurrentPage(val);
                }
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Sibling count */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Sibling Count
            </label>
            <select
              value={siblingCount}
              onChange={(e) => setSiblingCount(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>

          {/* Size */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 500,
              }}
            >
              Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showFirstLast}
              onChange={(e) => setShowFirstLast(e.target.checked)}
            />
            Show First/Last buttons
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showPrevNext}
              onChange={(e) => setShowPrevNext(e.target.checked)}
            />
            Show Prev/Next buttons
          </label>
        </div>

        {/* Last action indicator */}
        {lastAction && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-secondary)',
            }}
          >
            <strong>Last action:</strong> {lastAction}
          </div>
        )}
      </section>

      {/* Live Preview */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '120px',
        }}
      >
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          siblingCount={siblingCount}
          showFirstLast={showFirstLast}
          showPrevNext={showPrevNext}
          size={size}
        />
      </section>

      {/* Edge Cases Demo */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Edge Cases</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Single Page (totalPages=1)</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                currentPage={1}
                totalPages={1}
                onPageChange={() => {}}
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Should render nothing (returns null)
            </p>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Few Pages (totalPages=3)</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                currentPage={2}
                totalPages={3}
                onPageChange={() => {}}
              />
            </div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Many Pages (totalPages=50, siblingCount=2)</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                currentPage={25}
                totalPages={50}
                siblingCount={2}
                onPageChange={() => {}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Current Props Display */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Current Props</h2>
        <CodeBlock
          language="tsx"
          code={`<Pagination
  currentPage={${currentPage}}
  totalPages={${totalPages}}
  onPageChange={handlePageChange}
  siblingCount={${siblingCount}}
  showFirstLast={${showFirstLast}}
  showPrevNext={${showPrevNext}}
  size="${size}"
/>`}
          showLineNumbers
        />
      </section>
    </main>
  );
}