"use client";

import Card from '@/shared/components/Card';
import Button from '@/shared/components/Button';
import styles from './page.module.css';
import ThemeToggle from '@/shared/components/ThemeToggle';

export default function CardTestPage() {
  return (
    <div className={styles.container}>
      <h1>Enhanced Card Component Test</h1>
        <ThemeToggle variant='both'/>
      <section className={styles.section}>
        <h2>Basic Card with Text</h2>
        <Card>
          <p>This is a basic card with some text content. It has default padding and background.</p>
        </Card>
      </section>

      <section className={styles.section}>
        <h2>Card with Multiple Elements (auto‑aligned)</h2>
        <Card>
          <h3>Card Title</h3>
          <p>
            Cards can contain any React nodes – headings, paragraphs, lists, etc.
          </p>
          <ul>
            <li>Item one</li>
            <li>Item two</li>
            <li>Item three</li>
          </ul>
          <Button size="sm">Action Button</Button>
        </Card>
      </section>

      <section className={styles.section}>
        <h2>Card with Nested Elements</h2>
        <Card>
          <h3>Another Card</h3>
          <p>Here is a paragraph with a <code>code snippet</code> inside.</p>
          <pre>{`const greeting = "Hello, World!";
console.log(greeting);`}</pre>
          <blockquote>This is a blockquote – it has a moss‑colored left border.</blockquote>
          <p>And finally, a horizontal rule:</p>
          <hr />
          <p>All content is spaced consistently.</p>
        </Card>
      </section>

      <section className={styles.section}>
        <h2>Card with Custom Class</h2>
        <Card className={styles.customCard}>
          <p>
            This card uses a custom className to override styles. In this example,
            we add a thicker border and a different background.
          </p>
        </Card>
      </section>

      <section className={styles.section}>
        <h2>Cards in a Grid Layout</h2>
        <div className={styles.grid}>
          <Card>
            <h3>Card 1</h3>
            <p>Content for first card.</p>
          </Card>
          <Card>
            <h3>Card 2</h3>
            <p>Content for second card.</p>
          </Card>
          <Card>
            <h3>Card 3</h3>
            <p>Content for third card.</p>
          </Card>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Card Without Padding (via custom class)</h2>
        <Card className={styles.noPadding}>
          <div className={styles.coloredContent}>
            This card has custom padding: 0. The inner div has a colored background to show the card edges.
          </div>
        </Card>
      </section>
    </div>
  );
}