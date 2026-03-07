import React from 'react';
import { FaCode, FaFire, FaUsers, FaChartLine } from 'react-icons/fa';
import StatCard from '@/shared/components/StatCard';
import ProgressBar from '@/shared/components/ProgressBar';
import styles from './page.module.css';

export default function TestPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Component Showcase</h1>

      {/* StatCard Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>StatCard</h2>
        <div className={styles.grid}>
          <StatCard
            label="Total Solved"
            value="147"
            icon={<FaCode />}
            trend={{ value: 12, direction: 'up', label: 'vs last week' }}
            description="Problems across all platforms"
          />
          <StatCard
            label="Current Streak"
            value="21"
            icon={<FaFire />}
            trend={{ value: 5, direction: 'up', label: 'days' }}
            size="sm"
          />
          <StatCard
            label="Followers"
            value="89"
            icon={<FaUsers />}
            trend={{ value: 3, direction: 'down', label: 'this month' }}
          />
          <StatCard
            label="Mastery Rate"
            value="76%"
            icon={<FaChartLine />}
            description="Based on solved patterns"
            size="sm"
          />
          <StatCard
            label="Loading Example"
            value="42"
            isLoading
            icon={<FaCode />}
          />
          <StatCard
            label="Clickable Card"
            value="Click me"
            href="/dashboard"
            icon={<FaChartLine />}
            description="Navigates to dashboard"
          />
        </div>
      </section>

      {/* ProgressBar Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ProgressBar</h2>
        <div className={styles.progressGrid}>
          <div className={styles.progressItem}>
            <h3>Default (auto variant)</h3>
            <ProgressBar value={75} label="Daily Goal" showValue />
            <ProgressBar value={45} label="Weekly Goal" showValue valuePosition="right" />
            <ProgressBar value={90} label="Almost done" showValue valuePosition="inside" />
          </div>

          <div className={styles.progressItem}>
            <ProgressBar value={60} label="Small" size="sm" />
            <h3>Sizes</h3>
            <ProgressBar value={60} label="Medium" size="md" />
            <ProgressBar value={60} label="Large" size="lg" />
          </div>

          <div className={styles.progressItem}>
            <h3>Variants</h3>
            <ProgressBar value={30} label="Default" variant="default" />
            <ProgressBar value={95} label="Success" variant="success" />
            <ProgressBar value={60} label="Warning" variant="warning" />
            <ProgressBar value={20} label="Danger" variant="danger" />
          </div>

          <div className={styles.progressItem}>
            <h3>Indeterminate</h3>
            <ProgressBar value={0} indeterminate label="Loading..." />
          </div>

          <div className={styles.progressItem}>
            <h3>No label / no value</h3>
            <ProgressBar value={80} showValue={false} />
            <ProgressBar value={33} label="Only label" showValue={false} />
          </div>
        </div>
      </section>
    </div>
  );
}