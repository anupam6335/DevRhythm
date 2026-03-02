"use client";

import { useState, useRef } from 'react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import ThemeToggle from '@/shared/components/ThemeToggle';
import CodeBlock from '@/shared/components/CodeBlock';
import { FaLock, FaUnlock, FaExclamationTriangle } from 'react-icons/fa';

export default function ModalTestPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState<'sm' | 'md' | 'lg' | 'full'>('md');
  const [showCloseButton, setShowCloseButton] = useState(true);
  const [closeOnBackdrop, setCloseOnBackdrop] = useState(true);
  const [closeOnEsc, setCloseOnEsc] = useState(true);
  const [preventScroll, setPreventScroll] = useState(true);
  const [customIcon, setCustomIcon] = useState(false);
  const [preventClose, setPreventClose] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const [lastCloseSource, setLastCloseSource] = useState<string>('');

  // Refs for focus management testing
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const openModal = (modalSize: 'sm' | 'md' | 'lg' | 'full') => {
    setSize(modalSize);
    setIsOpen(true);
  };

  const handleCloseAttempt = (source: { source: string }) => {
    setLastCloseSource(source.source);
    if (preventClose) {
      alert(`Close prevented via onCloseAttempt (source: ${source.source})`);
      return false; // Prevents closing
    }
    return true;
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>
          Modal Component – Advanced Test Page
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {/* Size selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="full">Full</option>
            </select>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={showCloseButton}
                onChange={(e) => setShowCloseButton(e.target.checked)}
              />
              Show close button
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={closeOnBackdrop}
                onChange={(e) => setCloseOnBackdrop(e.target.checked)}
              />
              Close on backdrop click
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={closeOnEsc}
                onChange={(e) => setCloseOnEsc(e.target.checked)}
              />
              Close on Escape key
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={preventScroll}
                onChange={(e) => setPreventScroll(e.target.checked)}
              />
              Prevent body scroll
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={customIcon}
                onChange={(e) => setCustomIcon(e.target.checked)}
              />
              Custom close icon (<FaLock />)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={hasDescription}
                onChange={(e) => setHasDescription(e.target.checked)}
              />
              Add description (aria-describedby)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={preventClose}
                onChange={(e) => setPreventClose(e.target.checked)}
              />
              Prevent closing (simulate unsaved changes)
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
          <Button onClick={() => openModal('sm')}>Open Small Modal</Button>
          <Button onClick={() => openModal('md')} variant="secondary">Open Medium Modal</Button>
          <Button onClick={() => openModal('lg')} variant="outline">Open Large Modal</Button>
          <Button onClick={() => openModal('full')} variant="ghost">Open Full Modal</Button>
        </div>

        {lastCloseSource && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
            <strong>Last close source:</strong> {lastCloseSource}
          </div>
        )}
      </section>

      {/* Focus management test inputs */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Focus Management Test</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Focus target (initialFocusRef)"
            style={{
              padding: '0.5rem',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-input)',
              borderRadius: 'var(--radius)',
              color: 'var(--text-primary)',
            }}
          />
          <Button ref={buttonRef} variant="secondary">Return focus target (returnFocusRef)</Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(true);
              // Set initialFocusRef to the input
              setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
              }, 100);
            }}
          >
            Open with initial focus on input
          </Button>
        </div>
      </section>

      {/* Example code */}
      <section
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Live Example Code</h2>
        <CodeBlock
          language="tsx"
          code={`<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="${size.charAt(0).toUpperCase() + size.slice(1)} Modal"
  size="${size}"
  showCloseButton={${showCloseButton}}
  closeOnBackdropClick={${closeOnBackdrop}}
  closeOnEsc={${closeOnEsc}}
  preventScroll={${preventScroll}}
  ${customIcon ? 'closeIcon={<FaLock />}' : ''}
  ${hasDescription ? 'describedBy="modal-desc"' : ''}
  onCloseAttempt={handleCloseAttempt}
  ${preventClose ? '// onCloseAttempt prevents closing' : ''}
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={() => setIsOpen(false)}>Confirm</Button>
    </>
  }
>
  <p>Modal content goes here.</p>
  ${hasDescription ? '<p id="modal-desc">This is a description for screen readers.</p>' : ''}
</Modal>`}
          showLineNumbers
        />
      </section>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setLastCloseSource('');
        }}
        title={`${size.charAt(0).toUpperCase() + size.slice(1)} Modal`}
        size={size}
        showCloseButton={showCloseButton}
        closeOnBackdropClick={closeOnBackdrop}
        closeOnEsc={closeOnEsc}
        preventScroll={preventScroll}
        closeIcon={customIcon ? <FaLock /> : undefined}
        describedBy={hasDescription ? 'modal-description' : undefined}
        onCloseAttempt={handleCloseAttempt}
        initialFocusRef={inputRef} // optional, can be set dynamically via button above
        returnFocusRef={buttonRef}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <div>
          <p>
            This is a <strong>{size}</strong> modal with the following settings:
          </p>
          <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
            <li>Close button: {showCloseButton ? 'visible' : 'hidden'}</li>
            <li>Backdrop click: {closeOnBackdrop ? 'enabled' : 'disabled'}</li>
            <li>Escape key: {closeOnEsc ? 'enabled' : 'disabled'}</li>
            <li>Body scroll lock: {preventScroll ? 'enabled' : 'disabled'}</li>
            <li>Close prevention: {preventClose ? 'active' : 'inactive'}</li>
          </ul>

          {hasDescription && (
            <p id="modal-description" style={{ marginTop: '1rem', fontStyle: 'italic' }}>
              This is an additional description referenced by aria-describedby.
            </p>
          )}

          <hr style={{ margin: '1rem 0', borderColor: 'var(--divider)' }} />

          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>

          {/* Input to test focus trapping */}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Test focus trap:</label>
            <input
              type="text"
              placeholder="Try tabbing here"
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-input)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>
    </main>
  );
}