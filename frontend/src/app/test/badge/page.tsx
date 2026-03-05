// src/app/test/badge/page.tsx

import React from 'react';
import Badge from '@/shared/components/Badge';
import {
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaLeaf,
  FaStar,
  FaCode,
  FaFire,
  FaCalendarAlt,
  FaTag,
} from 'react-icons/fa';
import styles from './page.module.css';

export default function BadgeTestPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Badge Component Test</h1>
      <p className={styles.description}>
        Displaying all variants, sizes, and optional icons of the Badge component.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Variants</h2>
        <div className={styles.grid}>
          <Badge pill variant="default">Default</Badge>
          <Badge pill variant="primary">Primary</Badge>
          <Badge pill variant="success">Success</Badge>
          <Badge pill variant="warning">Warning</Badge>
          <Badge pill variant="error">Error</Badge>
          <Badge pill variant="info">Info</Badge>
          <Badge pill variant="moss">Moss</Badge>
          <Badge pill variant="sand">Sand</Badge>
          <Badge pill variant="easy">Easy</Badge>
          <Badge pill variant="medium">Medium</Badge>
          <Badge pill variant="hard">Hard</Badge>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sizes</h2>
        <div className={styles.grid}>
          <Badge pill size="sm" variant="primary">Small</Badge>
          <Badge pill size="md" variant="primary">Medium</Badge>
          <Badge pill size="lg" variant="primary">Large</Badge>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>With Icons (Leading)</h2>
        <div className={styles.grid}>
          <Badge pill variant="success" icon={<FaCheck />}>Completed</Badge>
          <Badge pill variant="warning" icon={<FaExclamationTriangle />}>Warning</Badge>
          <Badge pill variant="info" icon={<FaInfoCircle />}>Info</Badge>
          <Badge pill variant="moss" icon={<FaLeaf />}>Eco</Badge>
          <Badge pill variant="primary" icon={<FaStar />}>Featured</Badge>
          <Badge pill variant="error" icon={<FaFire />}>Hot</Badge>
          <Badge pill variant="default" icon={<FaCode />}>Code</Badge>
          <Badge pill variant="sand" icon={<FaCalendarAlt />}>Due soon</Badge>
          <Badge pill variant="easy" icon={<FaTag />}>Easy</Badge>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pill Shape</h2>
        <div className={styles.grid}>
          <Badge pill variant="success">Pill Success</Badge>
          <Badge pill variant="error" icon={<FaExclamationTriangle />}>Error Pill</Badge>
          <Badge pill variant="moss" size="lg" icon={<FaLeaf />}>Large Moss</Badge>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Combined Examples</h2>
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, auto))' }}>
          <Badge pill variant="hard" size="sm" icon={<FaFire />}>Hard</Badge>
          <Badge pill variant="medium" size="md" icon={<FaCode />}>Medium</Badge>
          <Badge pill variant="easy" size="lg" icon={<FaLeaf />}>Easy</Badge>
          <Badge  variant="success" pill size="sm" icon={<FaCheck />}>Done</Badge>
          <Badge  variant="warning" pill size="md" icon={<FaExclamationTriangle />}>Review</Badge>
          <Badge  variant="error" pill size="lg" icon={<FaFire />}>Urgent</Badge>
        </div>
      </section>
    </div>
  );
}