/**
 * Font family constants – use these in inline styles or to reference CSS variables.
 */

// CSS variable names (defined in globals.css)
export const BODY_FONT = 'var(--font-body)';
export const HEADING_FONT = 'var(--font-heading)';
export const CODE_FONT = 'var(--font-code)';
export const NOTES_FONT = 'var(--font-notes)';

// Raw font stacks (if you need to use them directly in JavaScript)
export const BODY_FONT_STACK = 'var(--font-commissioner), system-ui, sans-serif';
export const HEADING_FONT_STACK = 'var(--font-outfit), system-ui, sans-serif';
export const CODE_FONT_STACK = 'Cascadia Mono, Consolas, monospace';
export const NOTES_FONT_STACK = 'var(--font-patrick-hand), cursive';

// Individual Next.js font variable names (for custom CSS)
export const FONT_COMMISSIONER_VAR = 'var(--font-commissioner)';
export const FONT_OUTFIT_VAR = 'var(--font-outfit)';
export const FONT_PATRICK_HAND_VAR = 'var(--font-patrick-hand)';