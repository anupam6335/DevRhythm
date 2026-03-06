'use client';

import React from 'react';
import Breadcrumb from '@/shared/components/Breadcrumb';
import {
  HiHome,
  HiDocument,
  HiFolder,
  HiChevronDoubleRight,
  HiUser,
  HiCog,
  HiDotsHorizontal
} from 'react-icons/hi';
import styles from './page.module.css';
import ThemeToggle from '@/shared/components/ThemeToggle';

// Mock Next.js Link component that accepts className
const MockLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    className={className}
    onClick={(e) => {
      e.preventDefault();
      alert(`Navigated to ${href}`);
    }}
  >
    {children}
  </a>
);

export default function BreadcrumbTestPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Breadcrumb Component Tests</h1>
    <ThemeToggle variant='both'/>
      {/* Test Case 1: Basic Usage with default separator '/' */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Basic Usage (default separator '/')</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Docs', href: '/docs' },
              { label: 'Components' },
            ]}
          />
        </div>
        <p className={styles.note}>Home and Docs are links; Components is current (not clickable).</p>
      </section>

      {/* Test Case 2: With Icons */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. With Icons</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/', icon: <HiHome /> },
              { label: 'Profile', href: '/profile', icon: <HiUser /> },
              { label: 'Settings', icon: <HiCog /> },
            ]}
          />
        </div>
        <p className={styles.note}>Icons appear before labels.</p>
      </section>

      {/* Test Case 3: Custom Separator */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Custom Separator (Double Chevron)</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/', icon: <HiHome /> },
              { label: 'Projects', href: '/projects', icon: <HiFolder /> },
              { label: 'Documentation', icon: <HiDocument /> },
            ]}
            separator={<HiChevronDoubleRight />}
          />
        </div>
        <p className={styles.note}>Uses double chevron as separator.</p>
      </section>

      {/* Test Case 4: Max Items (Collapse) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Max Items = 3 (with collapse)</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Root', href: '/' },
              { label: 'Users', href: '/users' },
              { label: 'John Doe', href: '/users/johndoe' },
              { label: 'Repositories', href: '/users/johndoe/repos' },
              { label: 'devrhythm-frontend', href: '/users/johndoe/repos/devrhythm-frontend' },
              { label: 'src', href: '/users/johndoe/repos/devrhythm-frontend/src' },
              { label: 'shared' },
            ]}
            maxItems={3}
          />
        </div>
        <p className={styles.note}>
          Collapses to first 2 items + ellipsis (<HiDotsHorizontal />) + last item.
        </p>
      </section>

      {/* Test Case 5: Custom Link Renderer (Mock Next.js Link) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Custom Link Renderer (Mock Next.js Link)</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard', icon: <HiHome /> },
              { label: 'Analytics', href: '/analytics', icon: <HiDocument /> },
              { label: 'Reports' },
            ]}
            renderLink={(item, { className, children }) => (
              <MockLink href={item.href!} className={className}>
                {children}
              </MockLink>
            )}
          />
        </div>
        <p className={styles.note}>
          Uses a custom link component that receives the correct className, ensuring icon alignment.
        </p>
      </section>

      {/* Test Case 6: Single Item */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Single Item</h2>
        <div className={styles.card}>
          <Breadcrumb items={[{ label: 'Home' }]} />
        </div>
        <p className={styles.note}>Renders only the item with no separator.</p>
      </section>

      {/* Test Case 7: Empty Items */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Empty Items Array</h2>
        <div className={styles.card}>
          <Breadcrumb items={[]} />
          <p className={styles.placeholder}>(Nothing rendered – component returns null)</p>
        </div>
        <p className={styles.note}>Should render nothing (null).</p>
      </section>

      {/* Test Case 8: Long Labels */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Long Labels</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'A very long breadcrumb item that might overflow', href: '/long' },
              { label: 'Another extremely lengthy label for testing purposes' },
            ]}
          />
        </div>
        <p className={styles.note}>Handles long text gracefully (wrap or truncate).</p>
      </section>

      {/* Test Case 9: Custom ARIA Label */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Custom ARIA Label</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Products', href: '/products' },
              { label: 'Electronics', href: '/electronics' },
              { label: 'Laptops' },
            ]}
            aria-label="Product navigation"
          />
        </div>
        <p className={styles.note}>Uses <code>aria-label="Product navigation"</code>.</p>
      </section>

      {/* Test Case 10: Last Item with href (edge case) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Last Item with href</h2>
        <div className={styles.card}>
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog', href: '/blog' },
              { label: 'Post', href: '/blog/post' },
            ]}
          />
        </div>
        <p className={styles.note}>
          Last item has href but is marked as current; it will be a link but with{' '}
          <code>aria-current="page"</code>.
        </p>
      </section>
    </div>
  );
}