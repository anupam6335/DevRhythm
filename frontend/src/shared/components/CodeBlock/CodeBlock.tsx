import React, { useState, useRef, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { FaCopy, FaEdit, FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import styles from './CodeBlock.module.css';

export interface CodeBlockProps {
  /** The code content to display */
  code: string;
  /** Programming language for syntax highlighting (e.g., 'javascript', 'python') */
  language: string;
  /** Whether to show line numbers (default: false) */
  showLineNumbers?: boolean;
  /** If true, the user is an admin and can edit/delete the code */
  isAdmin?: boolean;
  /** Callback when code is saved (only for admins) */
  onSave?: (newCode: string) => void;
  /** Callback when code is deleted (only for admins) */
  onDelete?: () => void;
  /** Additional CSS class names */
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code: initialCode,
  language,
  showLineNumbers = false,
  isAdmin = false,
  onSave,
  onDelete,
  className = '',
  ...rest
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCode, setDraftCode] = useState(initialCode);
  const [copySuccess, setCopySuccess] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset draft when initial code changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      setDraftCode(initialCode);
    }
  }, [initialCode, isEditing]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftCode);
      setCopySuccess(true);
      setLiveMessage('Code copied to clipboard');
      copyTimeoutRef.current = setTimeout(() => {
        setCopySuccess(false);
        setLiveMessage('');
      }, 2000);
    } catch (err) {
      setLiveMessage('Failed to copy code');
      console.error('Copy failed:', err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave?.(draftCode);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftCode(initialCode);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this code?')) {
      onDelete?.();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftCode(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert 2 spaces at cursor position
      const newValue = draftCode.substring(0, start) + '  ' + draftCode.substring(end);
      setDraftCode(newValue);

      // Move cursor after the inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} {...rest}>
      <div className={styles.header}>
        <span className={styles.languageBadge}>{language}</span>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={handleCopy}
            className={styles.iconButton}
            aria-label="Copy code"
            title="Copy"
          >
            <FaCopy />
            {copySuccess && (
              <span className={styles.copyFeedback} role="status" aria-live="polite">
                Copied!
              </span>
            )}
          </button>
          {isAdmin && !isEditing && (
            <button
              type="button"
              onClick={handleEdit}
              className={styles.iconButton}
              aria-label="Edit code"
              title="Edit"
            >
              <FaEdit />
            </button>
          )}
          {isAdmin && isEditing && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className={styles.iconButton}
                aria-label="Save code"
                title="Save"
              >
                <FaSave />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.iconButton}
                aria-label="Cancel editing"
                title="Cancel"
              >
                <FaTimes />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.iconButton}
                aria-label="Delete code"
                title="Delete"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
      <div className={styles.codeWrapper}>
        {isEditing ? (
          <textarea
            value={draftCode}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
            spellCheck={false}
            aria-label="Editable code"
          />
        ) : (
          <SyntaxHighlighter
            language={language.toLowerCase()}
            showLineNumbers={showLineNumbers}
            wrapLines
            useInlineStyles={false}
          >
            {draftCode}
          </SyntaxHighlighter>
        )}
      </div>
      {/* Live region for screen readers */}
      <div className={styles.liveRegion} role="status" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
    </div>
  );
};

export default CodeBlock;