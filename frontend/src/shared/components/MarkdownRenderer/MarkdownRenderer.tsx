'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';
import CodeBlock from '@/shared/components/CodeBlock';
import styles from './MarkdownRenderer.module.css';

export interface MarkdownRendererProps {
  /**
   * Markdown content to render (as children). Use either `children` or `content`.
   */
  children?: string;
  /**
   * Alternative way to pass markdown content (takes precedence over children).
   */
  content?: string;
  /**
   * Additional CSS class name for the container.
   */
  className?: string;
  /**
   * If `true`, apply the notes font and background (for user notes).
   * @default false
   */
  useNotesFont?: boolean;
  /**
   * List of HTML elements to disallow. Overrides allowedElements.
   */
  disallowedElements?: string[];
  /**
   * List of HTML elements to allow. If not set, all are allowed (except those in disallowedElements).
   */
  allowedElements?: string[];
  /**
   * If true, unwrap disallowed elements (remove them but keep children).
   */
  unwrapDisallowed?: boolean;
  /**
   * If `true`, the current user is an admin and can edit/delete code blocks.
   * (Passed down to the CodeBlock component.)
   */
  isAdmin?: boolean;
  /**
   * Callback when a code block is saved (only for admins). Receives the new code and the original language.
   */
  onCodeSave?: (newCode: string, language: string) => void;
  /**
   * Callback when a code block is deleted (only for admins).
   */
  onCodeDelete?: (language: string) => void;
}

/**
 * Renders markdown content with syntax highlighting (using the existing CodeBlock component)
 * and theme‑aware styling. Supports GitHub Flavored Markdown (tables, task lists, etc.).
 *
 * @example
 * <MarkdownRenderer useNotesFont>
 *   # Heading
 *   Some **bold** text.
 *   ```js
 *   console.log('Hello');
```

· </MarkdownRenderer>
· 
· @example
· <MarkdownRenderer content={markdownString} />

*/
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  children,
  content,
  className,
  useNotesFont = false,
  disallowedElements,
  allowedElements,
  unwrapDisallowed,
  isAdmin = false,
  onCodeSave,
  onCodeDelete,
}) => {
  // Use content prop if provided, otherwise fall back to children
  const markdown = content !== undefined ? content : children;

  return (
    <div className={clsx(styles.markdown, useNotesFont && styles.notesFont, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={disallowedElements}
        allowedElements={allowedElements}
        unwrapDisallowed={unwrapDisallowed}
        components={{
          // Headings
          h1: ({ node, ...props }) => <h1 className={styles.h1} {...props} />,
          h2: ({ node, ...props }) => <h2 className={styles.h2} {...props} />,
          h3: ({ node, ...props }) => <h3 className={styles.h3} {...props} />,
          h4: ({ node, ...props }) => <h4 className={styles.h4} {...props} />,
          h5: ({ node, ...props }) => <h5 className={styles.h5} {...props} />,
          h6: ({ node, ...props }) => <h6 className={styles.h6} {...props} />,
          // Paragraph
          p: ({ node, ...props }) => <p className={styles.p} {...props} />,
          // Lists
          ul: ({ node, ...props }) => <ul className={styles.ul} {...props} />,
          ol: ({ node, ...props }) => <ol className={styles.ol} {...props} />,
          li: ({ node, ...props }) => <li className={styles.li} {...props} />,
          // Links
          a: ({ node, href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                className={styles.a}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Images
          img: ({ node, alt, src, ...props }) => (
            <img src={src} alt={alt} className={styles.img} loading="lazy" {...props} />
          ),
          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote className={styles.blockquote} {...props} />
          ),
          // Code (inline and block)
          code: (props) => {
            // Destructure safely with a type assertion to access 'inline'
            const { node, className, children } = props as any;
            const inline = (props as any).inline;
            const match = /language-(\S+)/.exec(className || '');
            const language = match ? match[1] : '';
            if (!inline && language) {
              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  language={language}
                  showLineNumbers={true}
                  isAdmin={isAdmin}
                  onSave={(newCode) => onCodeSave?.(newCode, language)}
                  onDelete={() => onCodeDelete?.(language)}
                  className={styles.codeBlockWrapper}
                />
              );
            }
            return (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            );
          },
          // Pre (for code blocks) – override to avoid double <pre> wrapping
          pre: ({ node, children, ...props }) => (
            <pre className={styles.pre} {...props}>
              {children}
            </pre>
          ),
          // Horizontal rule
          hr: ({ node, ...props }) => <hr className={styles.hr} {...props} />,
          // Tables (from GFM)
          table: ({ node, ...props }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table} {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className={styles.thead} {...props} />,
          tbody: ({ node, ...props }) => <tbody className={styles.tbody} {...props} />,
          tr: ({ node, ...props }) => <tr className={styles.tr} {...props} />,
          th: ({ node, ...props }) => <th className={styles.th} {...props} />,
          td: ({ node, ...props }) => <td className={styles.td} {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
