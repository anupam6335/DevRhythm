"use client";

import { useState } from 'react';
import Loader from '@/shared/components/Loader';
import Button from '@/shared/components/Button';
import ThemeToggle from '@/shared/components/ThemeToggle';

export default function LoaderTestPage() {
  const [showFullScreen, setShowFullScreen] = useState(false);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>
        Loader Component Test

        <ThemeToggle variant="both" label="Toggle theme" />
      </h1>

      {/* Grid of loaders */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Variants</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
            justifyItems: 'center',
          }}
        >
          {/* Size variants */}
          <div style={{ textAlign: 'center' }}>
            <Loader size="sm" />
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Small</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Loader size="md" />
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Medium</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Loader size="lg" />
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Large</p>
          </div>

          {/* With text */}
          <div style={{ textAlign: 'center' }}>
            <Loader size="md" text="Loading..." />
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>With text</p>
          </div>

          {/* Overlay mode (simulated inside a card) */}
          <div
            style={{
              position: 'relative',
              width: '150px',
              height: '150px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <Loader overlay size="md" />
            <p
              style={{
                position: 'absolute',
                bottom: '8px',
                left: '0',
                right: '0',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
              }}
            >
              Overlay inside card
            </p>
          </div>

          {/* Different color (using a wrapper with custom color) */}
          <div style={{ textAlign: 'center', color: 'var(--accent-moss)' }}>
            <Loader size="md" />
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Custom color (inherits)
            </p>
          </div>
        </div>
      </section>

      {/* Full-screen loader demo */}
      <section>
        <h2 style={{ marginBottom: '1rem' }}>Full‑screen Loader</h2>
        <Button onClick={() => setShowFullScreen(true)} variant="primary">
          Show Full‑Screen Loader
        </Button>
        {showFullScreen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10000,
            }}
          >
            <Loader fullScreen size="lg" text="Loading..." />
            <Button
              onClick={() => setShowFullScreen(false)}
              variant="secondary"
              style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10001,
              }}
            >
              Close
            </Button>
          </div>
        )}
      </section>

      {/* Additional notes */}
      <footer style={{ marginTop: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <p>
          All loaders respect the current theme. The spinner inherits the color of its
          container unless overridden.
        </p>
      </footer>
    </main>
  );
}