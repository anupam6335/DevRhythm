'use client';

import React, { useState } from 'react';
import Tabs from '@/shared/components/Tabs';
import { TabsProps } from '@/shared/components/Tabs/Tabs';
import { FiHome, FiUser, FiSettings, FiBell, FiStar, FiHeart } from 'react-icons/fi';

export default function TabsTestPage() {
  const [activeBasic, setActiveBasic] = useState('tab1');
  const [activePills, setActivePills] = useState('home');
  const [activeIcons, setActiveIcons] = useState('profile');
  const [activeDisabled, setActiveDisabled] = useState('enabled1');
  const [activeSizes, setActiveSizes] = useState('size1');
  const [activeFullWidth, setActiveFullWidth] = useState('fw1');

  // Basic tabs data
  const basicTabs: TabsProps['tabs'] = [
    { id: 'tab1', label: 'Overview' },
    { id: 'tab2', label: 'Details' },
    { id: 'tab3', label: 'Settings' },
    { id: 'tab4', label: 'Activity' },
  ];

  // Pills tabs data
  const pillsTabs: TabsProps['tabs'] = [
    { id: 'home', label: 'Home' },
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'settings', label: 'Settings' },
  ];

  // Tabs with icons
  const iconTabs: TabsProps['tabs'] = [
    { id: 'home', label: 'Home', icon: <FiHome /> },
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'settings', label: 'Settings', icon: <FiSettings /> },
  ];

  // Tabs with disabled items
  const disabledTabs: TabsProps['tabs'] = [
    { id: 'enabled1', label: 'Enabled 1' },
    { id: 'disabled1', label: 'Disabled 1', disabled: true },
    { id: 'enabled2', label: 'Enabled 2' },
    { id: 'disabled2', label: 'Disabled 2', disabled: true },
  ];

  // Tabs for size demo
  const sizeTabs: TabsProps['tabs'] = [
    { id: 'size1', label: 'Small' },
    { id: 'size2', label: 'Medium' },
    { id: 'size3', label: 'Large' },
  ];

  // Tabs for full width demo
  const fullWidthTabs: TabsProps['tabs'] = [
    { id: 'fw1', label: 'First' },
    { id: 'fw2', label: 'Second' },
    { id: 'fw3', label: 'Third' },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h1>Tabs Component Test Page</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Demonstrating all variants, sizes, and states.
      </p>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Basic Underline Variant</h2>
        <Tabs
          tabs={basicTabs}
          activeTab={activeBasic}
          onChange={setActiveBasic}
          variant="underline"
        />
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
          Content for <strong>{activeBasic}</strong>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Pills Variant</h2>
        <Tabs
          tabs={pillsTabs}
          activeTab={activePills}
          onChange={setActivePills}
          variant="pills"
        />
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
          Content for <strong>{activePills}</strong>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>With Icons</h2>
        <Tabs
          tabs={iconTabs}
          activeTab={activeIcons}
          onChange={setActiveIcons}
          variant="underline"
        />
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
          Selected: <strong>{activeIcons}</strong>
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Disabled Tabs</h2>
        <Tabs
          tabs={disabledTabs}
          activeTab={activeDisabled}
          onChange={setActiveDisabled}
          variant="underline"
        />
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
          Active: <strong>{activeDisabled}</strong> (disabled tabs cannot be selected)
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Size Variants</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Small (sm)</h3>
          <Tabs
            tabs={sizeTabs}
            activeTab={activeSizes}
            onChange={setActiveSizes}
            variant="underline"
            size="sm"
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Medium (md) – default</h3>
          <Tabs
            tabs={sizeTabs}
            activeTab={activeSizes}
            onChange={setActiveSizes}
            variant="underline"
            size="md"
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3>Large (lg)</h3>
          <Tabs
            tabs={sizeTabs}
            activeTab={activeSizes}
            onChange={setActiveSizes}
            variant="underline"
            size="lg"
          />
        </div>
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Full Width (underline)</h2>
        <Tabs
          tabs={fullWidthTabs}
          activeTab={activeFullWidth}
          onChange={setActiveFullWidth}
          variant="underline"
          fullWidth
        />
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Full Width (pills)</h2>
        <Tabs
          tabs={fullWidthTabs}
          activeTab={activeFullWidth}
          onChange={setActiveFullWidth}
          variant="pills"
          fullWidth
        />
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Mixed Icons + Labels (pills)</h2>
        <Tabs
          tabs={[
            { id: 'star', label: 'Starred', icon: <FiStar /> },
            { id: 'heart', label: 'Liked', icon: <FiHeart /> },
            { id: 'settings', label: 'Settings', icon: <FiSettings /> },
          ]}
          activeTab="star"
          onChange={() => {}}
          variant="pills"
        />
      </section>

      <section style={{ marginBottom: '3rem' }}>
        <h2>Keyboard Navigation Test</h2>
        <p>Use ← and → arrows to navigate between tabs (skip disabled).</p>
        <Tabs
          tabs={disabledTabs}
          activeTab={activeDisabled}
          onChange={setActiveDisabled}
          variant="underline"
        />
      </section>
    </div>
  );
}