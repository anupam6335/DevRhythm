"use client";

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/shared/components/Button';
import {
  FaDownload,
  FaCog,
  FaEdit,
  FaUserEdit,
  FaShareAlt,
  FaEllipsisH,
  FaCheck,
  FaTimes,
  FaFile,
  FaArrowRight,
  FaPlus,
  FaStar,
  FaSun,
  FaMoon
} from 'react-icons/fa';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <main style={{
      padding: '2rem',
      backgroundColor: 'var(--bg-app)',
      color: 'var(--text-primary)',
      minHeight: '100vh',
      transition: 'background-color 0.2s, color 0.2s'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <Button
            variant="outline"
            onClick={toggleTheme}
            leftIcon={isDark ? <FaSun /> : <FaMoon />}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 8px 20px var(--shadow)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>
            Button System – Pill Design
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Clear hierarchy, hover lift, accessible focus ring, and proper emphasis.
          </p>

          {/* Variants */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>Variants</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Button variant="primary" leftIcon={<FaCheck />}>Primary</Button>
            <Button variant="secondary" leftIcon={<FaTimes />}>Secondary</Button>
            <Button variant="outline" leftIcon={<FaFile />}>Outline</Button>
            <Button variant="ghost" leftIcon={<FaArrowRight />}>Ghost</Button>
          </div>

          {/* States */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>Interactive States</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '2rem',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated)',
            padding: '1rem',
            borderRadius: '1rem',
            marginBottom: '1rem'
          }}>
            <Button variant="primary">Default</Button>
            <Button variant="primary" style={{ transform: 'translateY(-1px)', boxShadow: '0 4px 8px var(--shadow)' }}>Hover (simulated)</Button>
            <Button variant="primary" className="focus-ring-test" style={{ boxShadow: 'var(--focus-ring), 0 2px 4px var(--shadow)' }}>Focus (simulated)</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>

          {/* Sizes */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>Sizes</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Button variant="primary" size="sm" leftIcon={<FaPlus />}>Small</Button>
            <Button variant="primary" size="md">Medium (default)</Button>
            <Button variant="primary" size="lg" leftIcon={<FaStar />}>Large</Button>
          </div>

          {/* Icons */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>Icon Positions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Button variant="primary" leftIcon={<FaDownload />}>Download</Button>
            <Button variant="outline" rightIcon={<FaCog />}>Settings</Button>
            <Button variant="ghost" leftIcon={<FaEdit />} aria-label="Edit" />
          </div>

          {/* Loading & Full Width */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>Loading & Full Width</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <Button
              variant="primary"
              isLoading={isLoading}
              onClick={() => setIsLoading(!isLoading)}
            >
              {isLoading ? 'Loading...' : 'Toggle Loading'}
            </Button>
            <Button variant="secondary" fullWidth>Full Width Button</Button>
            <Button isLoading> Loading</Button>
          </div>

          {/* As Child (Next.js Link) */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>As Child (Link)</h3>
          <Button asChild variant="primary">
            <Link href="/dashboard">Go to Dashboard →</Link>
          </Button>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

          {/* Real-world example */}
          <h3 style={{ fontFamily: 'var(--font-heading)', margin: '2rem 0 1rem' }}>Example: Profile Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button variant="primary" leftIcon={<FaUserEdit />}>Edit Profile</Button>
            <Button variant="outline" leftIcon={<FaShareAlt />}>Share</Button>
            <Button variant="ghost" leftIcon={<FaEllipsisH />}>More</Button>
          </div>
        </div>

        {/* Original welcome content */}
        <nav style={{ marginTop: '2rem' }}>
          <ul style={{ listStyle: 'none', display: 'flex', gap: '1rem' }}>
            <li><Button asChild variant="outline"><Link href="/login">Login</Link></Button></li>
            <li><Button asChild variant="primary"><Link href="/dashboard">Dashboard</Link></Button></li>
          </ul>
        </nav>
      </div>
    </main>
  );
}