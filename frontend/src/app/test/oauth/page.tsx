"use client";

import { useState } from 'react';
import OAuthButton from '@/shared/components/OAuthButton';
import Button from '@/shared/components/Button';
import ThemeToggle from '@/shared/components/ThemeToggle';
import CodeBlock from '@/shared/components/CodeBlock';

export default function OAuthTestPage() {
  const [customText, setCustomText] = useState(false);
  const [disableIcon, setDisableIcon] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const handleMockClick = (provider: string) => {
    setLastAction(`Mock ${provider} click – no redirect`);
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
          OAuthButton – Test Page
        </h1>
        <ThemeToggle variant="both" label="Toggle theme" />
      </div>

      {/* Controls */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Controls</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={customText}
              onChange={(e) => setCustomText(e.target.checked)}
            />
            Custom button text
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={disableIcon}
              onChange={(e) => setDisableIcon(e.target.checked)}
            />
            Hide icon
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
            />
            Mock mode (prevent redirect)
          </label>
        </div>
        {lastAction && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
            <strong>Last action:</strong> {lastAction}
          </div>
        )}
      </section>

      {/* Google Variants */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Google OAuth Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <OAuthButton
            provider="google"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('Google')
                : undefined
            }
          >
            {customText ? 'Sign in with Google' : undefined}
          </OAuthButton>

          <OAuthButton
            provider="google"
            variant="primary"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('Google (primary)')
                : undefined
            }
          >
            {customText ? 'Google (primary)' : undefined}
          </OAuthButton>

          <OAuthButton
            provider="google"
            variant="outline"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('Google (outline)')
                : undefined
            }
          >
            {customText ? 'Google (outline)' : undefined}
          </OAuthButton>

          <OAuthButton
            provider="google"
            variant="ghost"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('Google (ghost)')
                : undefined
            }
          >
            {customText ? 'Google (ghost)' : undefined}
          </OAuthButton>
        </div>
      </section>

      {/* GitHub Variants */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>GitHub OAuth Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <OAuthButton
            provider="github"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('GitHub')
                : undefined
            }
          >
            {customText ? 'Sign in with GitHub' : undefined}
          </OAuthButton>

          <OAuthButton
            provider="github"
            variant="primary"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('GitHub (primary)')
                : undefined
            }
          >
            {customText ? 'GitHub (primary)' : undefined}
          </OAuthButton>

          <OAuthButton
            provider="github"
            variant="outline"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('GitHub (outline)')
                : undefined
            }
          >
            {customText ? 'GitHub (outline)' : undefined}
          </OAuthButton>

          <OAuthButton
            provider="github"
            variant="ghost"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('GitHub (ghost)')
                : undefined
            }
          >
            {customText ? 'GitHub (ghost)' : undefined}
          </OAuthButton>
        </div>
      </section>

      {/* Custom href example */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Custom `href` (bypass provider detection)</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <OAuthButton
            href="https://example.com/custom-oauth"
            showIcon={!disableIcon}
            onClick={
              mockMode
                ? () => handleMockClick('Custom href (mock)')
                : undefined
            }
          >
            Custom OAuth
          </OAuthButton>
          <span style={{ color: 'var(--text-secondary)' }}>
            (href: https://example.com/custom-oauth)
          </span>
        </div>
      </section>

      {/* Disabled & Loading states */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Disabled & Loading States</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <OAuthButton provider="google" disabled>
            Disabled
          </OAuthButton>
          <OAuthButton provider="github" disabled>
            Disabled
          </OAuthButton>
          <OAuthButton provider="google" isLoading>
            Loading
          </OAuthButton>
          <OAuthButton provider="github" isLoading>
            Loading
          </OAuthButton>
        </div>
      </section>

      {/* Info */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>How It Works</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          By default, the button redirects to <code>{process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google</code> or <code>/auth/github</code>.
          The backend then initiates the OAuth flow and finally redirects back to the frontend with tokens.
        </p>
        <CodeBlock
          language="tsx"
          code={`<OAuthButton provider="google" />
<OAuthButton provider="github" variant="primary" />
<OAuthButton href="/custom" showIcon={false}>Custom</OAuthButton>`}
        />
      </section>
    </main>
  );
}