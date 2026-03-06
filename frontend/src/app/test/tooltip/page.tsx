'use client';

import React from 'react';
import Tooltip from '@/shared/components/Tooltip';
import styles from './page.module.css'; 

export default function TooltipTestPage() {
  return (
    <main className={styles.container}>
      <h1>Tooltip Component Test</h1>
      <p>Hover or focus the elements below to see the tooltips.</p>

      <section className={styles.section}>
        <h2>Placement: Top (default)</h2>
        <Tooltip content="I'm on top">
          <button className={styles.button}>Hover me (top)</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Placement: Bottom</h2>
        <Tooltip content="I'm on bottom" placement="bottom">
          <button className={styles.button}>Hover me (bottom)</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Placement: Left</h2>
        <Tooltip content="I'm on left" placement="left">
          <button className={styles.button}>Hover me (left)</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Placement: Right</h2>
        <Tooltip content="I'm on right" placement="right">
          <button className={styles.button}>Hover me (right)</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Long content</h2>
        <Tooltip
          content="This is a much longer tooltip text that should wrap to multiple lines and demonstrate how the component handles longer descriptions."
          placement="bottom"
        >
          <button className={styles.button}>Long tooltip</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Disabled</h2>
        <Tooltip content="You won't see this" disabled>
          <button className={styles.button}>Disabled (no tooltip)</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Custom delay (1000ms)</h2>
        <Tooltip content="I appear after 1 second" delay={1000}>
          <button className={styles.button}>Slow tooltip</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Custom className on container</h2>
        <Tooltip
          content="I have custom outer styling"
          className={styles.customTooltipContainer}
        >
          <button className={styles.button}>Custom container</button>
        </Tooltip>
      </section>

      <section className={styles.section}>
        <h2>Element with focus (keyboard navigation)</h2>
        <Tooltip content="Focus me with Tab key">
          <button className={styles.button}>Focusable button</button>
        </Tooltip>
      </section>
    </main>
  );
}