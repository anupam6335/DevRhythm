"use client";

import React, { useState } from 'react';
import TextArea from '@/shared/components/TextArea';
import styles from './page.module.css';
import ThemeToggle from '@/shared/components/ThemeToggle';

export default function TextAreaTestPage() {
  const [basicValue, setBasicValue] = useState('');
  const [autoResizeValue, setAutoResizeValue] = useState('');
  const [withCounterValue, setWithCounterValue] = useState('');
  const [errorValue, setErrorValue] = useState('');
  const [disabledValue, setDisabledValue] = useState('This is disabled');
  const [readOnlyValue, setReadOnlyValue] = useState('This is read-only');

  // Simple validation: show error if text is too short
  const hasError = errorValue.length > 0 && errorValue.length < 10;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TextArea Component Test</h1>
        <ThemeToggle variant="both" label="Toggle theme" />

      <div className={styles.grid}>
        {/* Basic TextArea */}
        <div className={styles.card}>
          <h2>Basic</h2>
          <TextArea
            label="Basic TextArea"
            placeholder="Type something..."
            value={basicValue}
            onChange={(e) => setBasicValue(e.target.value)}
          />
          <p className={styles.note}>Value: {basicValue || '(empty)'}</p>
        </div>

        {/* With Helper Text */}
        <div className={styles.card}>
          <h2>With Helper Text</h2>
          <TextArea
            label="Notes"
            helperText="Add your personal notes here (optional)."
            placeholder="e.g., key insights..."
            value={basicValue}
            onChange={(e) => setBasicValue(e.target.value)}
          />
        </div>

        {/* Required */}
        <div className={styles.card}>
          <h2>Required</h2>
          <TextArea
            label="Required field"
            required
            placeholder="This field is required"
            value={basicValue}
            onChange={(e) => setBasicValue(e.target.value)}
          />
        </div>

        {/* With Character Counter */}
        <div className={styles.card}>
          <h2>With Character Counter</h2>
          <TextArea
            label="Limited input"
            helperText="Max 50 characters"
            maxLength={50}
            showCount
            value={withCounterValue}
            onChange={(e) => setWithCounterValue(e.target.value)}
          />
        </div>

        {/* Auto-resize */}
        <div className={styles.card}>
          <h2>Auto-resize</h2>
          <TextArea
            label="Auto-resizing"
            autoResize
            placeholder="Type multiple lines and see the height adjust..."
            value={autoResizeValue}
            onChange={(e) => setAutoResizeValue(e.target.value)}
          />
        </div>

        {/* Error State */}
        <div className={styles.card}>
          <h2>Error State</h2>
          <TextArea
            label="Feedback"
            error={hasError ? 'Must be at least 10 characters' : false}
            value={errorValue}
            onChange={(e) => setErrorValue(e.target.value)}
            placeholder="Type at least 10 chars to clear error"
          />
        </div>

        {/* Disabled */}
        <div className={styles.card}>
          <h2>Disabled</h2>
          <TextArea
            label="Disabled"
            disabled
            value={disabledValue}
            onChange={(e) => setDisabledValue(e.target.value)}
          />
        </div>

        {/* Read-only */}
        <div className={styles.card}>
          <h2>Read-only</h2>
          <TextArea
            label="Read-only"
            readOnly
            value={readOnlyValue}
            onChange={(e) => setReadOnlyValue(e.target.value)}
          />
        </div>

        {/* All Features Combined */}
        <div className={styles.card}>
          <h2>All Features</h2>
          <TextArea
            label="Combined"
            helperText="Helper text"
            error={hasError ? 'Error example' : false}
            maxLength={100}
            showCount
            autoResize
            required
            placeholder="Label, helper, error, counter, auto-resize, required..."
            value={errorValue}
            onChange={(e) => setErrorValue(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}