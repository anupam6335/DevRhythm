'use client';

import React, { useState } from 'react';
import Checkbox from '@/shared/components/Checkbox/Checkbox';
import styles from './page.module.css';

export default function CheckboxTestPage() {
  const [basicChecked, setBasicChecked] = useState(false);
  const [controlledChecked, setControlledChecked] = useState(true);
  const [indeterminate, setIndeterminate] = useState(true);
  const [disabledChecked, setDisabledChecked] = useState(false);
  const [errorChecked, setErrorChecked] = useState(false);

  return (
    <div className={styles.container}>
      <h1>Checkbox Component Test</h1>

      {/* Basic Checked / Unchecked */}
      <section className={styles.section}>
        <h2>Basic Checkbox</h2>
        <Checkbox
          label="Unchecked (basic)"
          checked={basicChecked}
          onChange={setBasicChecked}
        />
        <Checkbox
          label="Checked (basic)"
          checked={controlledChecked}
          onChange={setControlledChecked}
        />
        <div className={styles.note}>
          <strong>State:</strong> {basicChecked ? 'checked' : 'unchecked'} |{' '}
          {controlledChecked ? 'checked' : 'unchecked'}
        </div>
      </section>

      {/* Indeterminate State */}
      <section className={styles.section}>
        <h2>Indeterminate State</h2>
        <Checkbox
          label="Indeterminate (controlled)"
          indeterminate={indeterminate}
          checked={false}
          onChange={() => setIndeterminate(false)}
        />
        <Checkbox
          label="Indeterminate + checked? (should not happen)"
          indeterminate={indeterminate}
          checked={true}
          onChange={() => {}}
        />
        <button onClick={() => setIndeterminate(!indeterminate)}>
          Toggle Indeterminate
        </button>
        <p className={styles.note}>
          Note: When indeterminate is true, the checkbox shows a dash and
          `aria-checked="mixed"`. The checked prop is visually ignored.
        </p>
      </section>

      {/* Disabled State */}
      <section className={styles.section}>
        <h2>Disabled State</h2>
        <Checkbox
          label="Disabled unchecked"
          disabled
          checked={false}
          onChange={() => {}}
        />
        <Checkbox
          label="Disabled checked"
          disabled
          checked={true}
          onChange={() => {}}
        />
        <Checkbox
          label="Disabled indeterminate"
          disabled
          indeterminate
          checked={false}
          onChange={() => {}}
        />
      </section>

      {/* Error State */}
      <section className={styles.section}>
        <h2>Error State</h2>
        <Checkbox
          label="Error (boolean)"
          error
          checked={errorChecked}
          onChange={setErrorChecked}
        />
        <Checkbox
          label="Error with message string (not displayed)"
          error="This field is required"
          checked={false}
          onChange={() => {}}
        />
        <p className={styles.note}>
          Note: The error message is not displayed by the component itself – it's just for styling.
          The string form can be used by the parent for validation feedback.
        </p>
      </section>

      {/* Custom Class */}
      <section className={styles.section}>
        <h2>With Custom Class</h2>
        <Checkbox
          label="Custom background"
          className={styles.customCheckbox}
          checked={true}
          onChange={() => {}}
        />
      </section>

      {/* No Label */}
      <section className={styles.section}>
        <h2>No Label</h2>
        <Checkbox checked={false} onChange={() => {}} aria-label="Hidden label" />
        <span> (hidden label for screen readers)</span>
      </section>
    </div>
  );
}