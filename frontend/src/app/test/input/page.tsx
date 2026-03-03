"use client";

import React, { useState } from 'react';
import Input from '@/shared/components/Input';
import ThemeToggle from '@/shared/components/ThemeToggle';
import { FaUser, FaSearch, FaEnvelope, FaLock } from 'react-icons/fa';
import styles from './page.module.css';

export default function InputTestPage() {
  const [values, setValues] = useState({
    outline: '',
    filled: '',
    withIcons: '',
    error: '',
    disabled: 'Disabled input',
    readOnly: 'Read-only value',
  });

  const handleChange = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({ ...prev, [key]: e.target.value }));
  };

return (
  <>
    <div className={styles.header}>
      <h1 style={{marginLeft: "10rem"}}>Input Component Test</h1>
      <ThemeToggle variant="both" label="Toggle theme" />
    </div>

    <div className={styles.container}>
      <section className={styles.section}>
        <h2>Variants</h2>
        <div className={styles.grid}>
          <Input
            placeholder="Outline (default)"
            value={values.outline}
            onChange={handleChange('outline')}
          />
          <Input
            variant="filled"
            placeholder="Filled"
            value={values.filled}
            onChange={handleChange('filled')}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Sizes</h2>
        <div className={styles.grid}>
          <Input size="sm" placeholder="Small" />
          <Input size="md" placeholder="Medium (default)" />
          <Input size="lg" placeholder="Large" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>With Icons</h2>
        <div className={styles.grid}>
          <Input leftIcon={<FaUser />} placeholder="Username" />
          <Input leftIcon={<FaEnvelope />} placeholder="Email" type="email" />
          <Input
            leftIcon={<FaLock />}
            rightIcon={<FaSearch />}
            placeholder="Search with lock"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Error State</h2>
        <div className={styles.grid}>
          <Input error placeholder="Error (no icon)" defaultValue="Invalid value" />
          <Input
            error
            leftIcon={<FaUser />}
            placeholder="Error with icon"
            defaultValue="Wrong username"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Disabled & Read-Only</h2>
        <div className={styles.grid}>
          <Input
            disabled
            placeholder="Disabled"
            value={values.disabled}
            onChange={handleChange('disabled')}
          />
          <Input
            readOnly
            placeholder="Read-only"
            value={values.readOnly}
            onChange={handleChange('readOnly')}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>Full Width</h2>
        <Input
          fullWidth
          placeholder="Full width input"
          leftIcon={<FaSearch />}
        />
      </section>

      <section className={styles.section}>
        <h2>All Combined</h2>
        <div className={styles.grid}>
          <Input
            variant="filled"
            size="lg"
            leftIcon={<FaUser />}
            placeholder="Filled large with icon"
          />
          <Input
            variant="outline"
            size="sm"
            error
            leftIcon={<FaEnvelope />}
            placeholder="Small error with icon"
          />
        </div>
      </section>
    </div>
  </>
);
}