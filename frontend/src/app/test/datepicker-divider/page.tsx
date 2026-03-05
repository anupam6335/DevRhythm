'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import DatePicker from '@/shared/components/DatePicker';
import Divider from '@/shared/components/Divider';
import styles from './page.module.css';

export default function DatePickerDividerTestPage() {
  // Use fixed dates to avoid hydration mismatches
  const [basicDate, setBasicDate] = useState<Date | null>(null);
  const [minMaxDate, setMinMaxDate] = useState<Date | null>(null);
  const [timeDate, setTimeDate] = useState<Date | null>(null);
  const [disabledDate, setDisabledDate] = useState<Date | null>(new Date(2026, 2, 5)); // March 5, 2026

  // Deterministic date formatting (same on server & client)
  const formatDate = (date: Date | null) => {
    if (!date) return 'None';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className={styles.container}>
      <h1>DatePicker & Divider Test Page</h1>
      <p>
        This page demonstrates the <code>DatePicker</code> and <code>Divider</code> shared components.
      </p>

      {/* ===== Divider Examples ===== */}
      <section className={styles.section}>
        <h2>Divider</h2>

        <h3>Horizontal (default)</h3>
        <Divider />

        <h3>Horizontal with thickness 2px</h3>
        <Divider thickness={2} />

        <h3>Horizontal with custom color (accent-moss)</h3>
        <Divider color="var(--accent-moss)" thickness={2} />

        <h3>Horizontal with text (center)</h3>
        <Divider text="OR" textPosition="center" />

        <h3>Horizontal with text (left)</h3>
        <Divider text="Left aligned" textPosition="left" />

        <h3>Horizontal with text (right)</h3>
        <Divider text="Right aligned" textPosition="right" />

        <h3>Vertical dividers (inline)</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Item 1</span>
          <Divider orientation="vertical" />
          <span>Item 2</span>
          <Divider orientation="vertical" thickness={2} color="var(--accent-moss)" />
          <span>Item 3</span>
        </div>
      </section>

      {/* ===== DatePicker Examples ===== */}
      <section className={styles.section}>
        <h2>DatePicker</h2>

        <div className={styles.row}>
          <div className={styles.column}>
            <h3>Basic</h3>
            <DatePicker
              selected={basicDate}
              onChange={setBasicDate}
              placeholder="Pick a date"
            />
            <p className={styles.selectedValue}>Selected: {formatDate(basicDate)}</p>
          </div>

          <div className={styles.column}>
            <h3>With min/max (next 7 days)</h3>
            <DatePicker
              selected={minMaxDate}
              onChange={setMinMaxDate}
              minDate={new Date()}          // dynamic but safe (only affects calendar)
              maxDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
              placeholder="Pick a date within 7 days"
            />
            <p className={styles.selectedValue}>Selected: {formatDate(minMaxDate)}</p>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.column}>
            <h3>With time select</h3>
            <DatePicker
              selected={timeDate}
              onChange={setTimeDate}
              showTimeSelect
              dateFormat="yyyy-MM-dd HH:mm"
              placeholder="Pick date and time"
            />
            <p className={styles.selectedValue}>Selected: {formatDate(timeDate)}</p>
          </div>

          <div className={styles.column}>
            <h3>Disabled</h3>
            <DatePicker
              selected={disabledDate}
              onChange={setDisabledDate}
              disabled
              placeholder="Disabled picker"
            />
            <p className={styles.selectedValue}>Selected: {formatDate(disabledDate)}</p>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.column}>
            <h3>Custom date format (MM/dd/yyyy)</h3>
            <DatePicker
              selected={basicDate}
              onChange={setBasicDate}
              dateFormat="MM/dd/yyyy"
              placeholder="MM/dd/yyyy"
            />
          </div>

          <div className={styles.column}>
            <h3>With required and name</h3>
            <DatePicker
              selected={basicDate}
              onChange={setBasicDate}
              required
              name="test-date"
              id="test-date"
              placeholder="Required field"
            />
          </div>
        </div>
      </section>
    </div>
  );
}