'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMediaQuery } from '@/shared/hooks';
import Button from '@/shared/components/Button';
import Select from '@/shared/components/Select';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Extension } from '@codemirror/state';
import { FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiPlay, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { toast } from '@/shared/components/Toast';
import styles from './CodeExecutionArea.module.css';

interface TestCase {
  stdin: string;
  expected: string;
}

interface ExecutionResult {
  passed: boolean;
  input: string;
  expected: string;
  output: string;
  error?: string;
}

interface CodeExecutionAreaProps {
  questionId: string;
  defaultTestCases: TestCase[];
  starterCodeByLanguage?: Record<string, string>;
  initialLanguage: string;
  initialCustomTestCases?: TestCase[];
  onRun: (code: string, language: string, testCases: TestCase[]) => Promise<void>;
  isRunning: boolean;
  results?: ExecutionResult[];
  onCodeChange?: (code: string) => void;
  initialHistory: any[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const languageMap: Record<string, string> = {
  python: 'Python3',
  java: 'Java',
  cpp: 'C++',
};

// Custom theme with proper selection colors (no `theme="dark"` override)
const createCustomTheme = (isDark: boolean): Extension => {
  const backgroundColor = isDark ? 'var(--code-bg)' : 'var(--code-bg)';
  const textColor = isDark ? 'var(--code-text)' : 'var(--code-text)';
  return [
    EditorView.theme({
      '&': {
        backgroundColor,
        color: textColor,
        fontSize: '0.9rem',
        fontFamily: 'var(--font-code)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      },
      '.cm-editor': { backgroundColor },
      '.cm-scroller': { backgroundColor },
      '.cm-gutters': {
        backgroundColor: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border)',
        color: 'var(--text-muted)',
      },
      '.cm-activeLine': { backgroundColor: 'rgba(124, 139, 122, 0.1)' },
      '.cm-activeLineGutter': { backgroundColor: 'rgba(124, 139, 122, 0.1)' },
      // Selection styles – forced with !important to override defaults
      '.cm-selectionBackground': {
        backgroundColor: 'rgba(var(--accent-moss-rgb), 0.3) !important',
      },
      '.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(var(--accent-moss-rgb), 0.5) !important',
      },
    }),
    syntaxHighlighting(
      HighlightStyle.define([
        { tag: t.keyword, color: isDark ? '#f92672' : '#d73a49' },
        { tag: t.comment, color: isDark ? '#7c8b7a' : '#6a737d', fontStyle: 'italic' },
        { tag: t.string, color: isDark ? '#a6e22e' : '#032f62' },
        { tag: t.number, color: isDark ? '#ae81ff' : '#005cc5' },
        { tag: t.function(t.variableName), color: isDark ? '#66d9ef' : '#6f42c1' },
        { tag: t.operator, color: isDark ? '#f92672' : '#d73a49' },
      ])
    ),
  ];
};

const useTheme = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setIsDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);
  return isDark;
};

export const CodeExecutionArea: React.FC<CodeExecutionAreaProps> = ({
  questionId,
  defaultTestCases,
  starterCodeByLanguage,
  initialLanguage,
  initialCustomTestCases = [],
  onRun,
  isRunning,
  results,
  onCodeChange,
  initialHistory,
  activeTab,
  onTabChange,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDark = useTheme();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(initialLanguage);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>(initialCustomTestCases);
  const [testCasesCollapsed, setTestCasesCollapsed] = useState(isMobile);
  const skipStarterLoad = useRef(false);
  const autoSwitched = useRef(false);

  const getLanguageExtension = (lang: string) => {
    switch (lang) {
      case 'python': return python();
      case 'java': return java();
      case 'cpp': return cpp();
      default: return python();
    }
  };

  // Load last executed code from history on mount
  useEffect(() => {
    if (initialHistory.length > 0) {
      const sorted = [...initialHistory].sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
      const last = sorted[0];
      if (last) {
        let frontendLang = initialLanguage;
        for (const [key, val] of Object.entries(languageMap)) {
          if (val.toLowerCase() === last.language.toLowerCase()) {
            frontendLang = key;
            break;
          }
        }
        skipStarterLoad.current = true;
        setLanguage(frontendLang);
        setCode(last.code);
        if (onCodeChange) onCodeChange(last.code);
        setTimeout(() => { skipStarterLoad.current = false; }, 100);
      }
    }
  }, [initialHistory, initialLanguage, onCodeChange]);

  useEffect(() => {
    if (skipStarterLoad.current) return;
    if (starterCodeByLanguage) {
      const backendLang = languageMap[language];
      const starter = starterCodeByLanguage[backendLang];
      if (starter) {
        setCode(starter);
        if (onCodeChange) onCodeChange(starter);
      } else {
        setCode(`# Write your solution here for ${language}\n`);
        if (onCodeChange) onCodeChange(`# Write your solution here for ${language}\n`);
      }
    }
  }, [language, starterCodeByLanguage, onCodeChange]);

  useEffect(() => {
    if (onCodeChange) onCodeChange(code);
  }, [code, onCodeChange]);

  // Auto‑switch to results tab when new results arrive, but only once per run
  useEffect(() => {
    if (results && results.length > 0 && !autoSwitched.current) {
      autoSwitched.current = true;
      onTabChange('results');
      setTimeout(() => { autoSwitched.current = false; }, 500);
    }
  }, [results, onTabChange]);

  const handleAddCustom = () => {
    setCustomTestCases(prev => [...prev, { stdin: '', expected: '' }]);
  };

  const handleRemoveCustom = (index: number) => {
    setCustomTestCases(prev => prev.filter((_, i) => i !== index));
  };

  const handleCustomChange = (index: number, field: 'stdin' | 'expected', value: string) => {
    setCustomTestCases(prev => prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc)));
  };

  const handleRun = () => {
    const combined = [...defaultTestCases, ...customTestCases];
    onRun(code, language, combined);
  };

  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
  ];

  const customTheme = useMemo(() => createCustomTheme(isDark), [isDark]);

  const tabs = [
    { id: 'code', label: 'Code' },
    { id: 'history', label: 'History' },
    { id: 'results', label: 'Results' },
  ];

  const passedCount = results?.filter(r => r.passed).length || 0;
  const totalCount = results?.length || 0;

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.languageRow}>
          <Select options={languageOptions} value={language} onChange={setLanguage} className={styles.select} />
        </div>
        <div className={styles.tabsSwitch}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button variant="primary" size="sm" onClick={handleRun} isLoading={isRunning} leftIcon={<FiPlay />} className={styles.runButton}>
          Run Code
        </Button>
      </div>

      {activeTab === 'code' && (
        <>
          <CodeMirror
            value={code}
            onChange={(val) => {
              setCode(val);
              if (onCodeChange) onCodeChange(val);
            }}
            height={isMobile ? '300px' : '500px'}
            extensions={[getLanguageExtension(language), customTheme]}
            // Removed `theme="dark"` to avoid overriding our custom theme
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
            className={styles.editor}
          />

          <div className={styles.testCasesSection}>
            <div className={styles.testCasesHeader}>
              <strong>Test Cases</strong>
              <div className={styles.testCasesHeaderActions}>
                <button className={styles.addButtonSmall} onClick={handleAddCustom}>
                  <FiPlus /> Add
                </button>
                <button className={styles.toggleButton} onClick={() => setTestCasesCollapsed(!testCasesCollapsed)}>
                  {testCasesCollapsed ? <FiChevronDown /> : <FiChevronUp />}
                </button>
              </div>
            </div>

            {!testCasesCollapsed && (
              <div className={styles.testCasesList}>
                <div className={styles.testCasesHeaderRow}>
                  <div className={styles.testCasesHeaderCell}>Input</div>
                  <div className={styles.testCasesHeaderCell}>Expected</div>
                </div>
                {defaultTestCases.map((tc, idx) => (
                  <div key={`default-${idx}`} className={styles.testCaseRow}>
                    <div className={styles.testCaseCell}>
                      <code className={styles.mono}>{tc.stdin}</code>
                    </div>
                    <div className={styles.testCaseCell}>
                      <code className={styles.mono}>{tc.expected}</code>
                    </div>
                  </div>
                ))}
                {customTestCases.map((tc, idx) => (
                  <div key={`custom-${idx}`} className={styles.testCaseRowEditable}>
                    <div className={styles.testCaseCell}>
                      <textarea
                        value={tc.stdin}
                        onChange={(e) => handleCustomChange(idx, 'stdin', e.target.value)}
                        className={styles.editableInput}
                        rows={2}
                      />
                    </div>
                    <div className={styles.testCaseCell}>
                      <textarea
                        value={tc.expected}
                        onChange={(e) => handleCustomChange(idx, 'expected', e.target.value)}
                        className={styles.editableInput}
                        rows={2}
                      />
                    </div>
                    <button className={styles.deleteButton} onClick={() => handleRemoveCustom(idx)}>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className={styles.historyPanel}>
          {initialHistory.length === 0 ? (
            <div className={styles.historyEmpty}>No execution history yet.</div>
          ) : (
            <div className={styles.historyList}>
              {initialHistory.map((entry: any) => (
                <div key={entry._id} className={styles.historyItem}>
                  <div className={styles.historyInfo}>
                    <strong>{entry.language}</strong> · {new Date(entry.executedAt).toLocaleString()}
                    <br />
                    <small>{entry.summary.passedCount}/{entry.summary.totalCount} passed</small>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      let frontendLang = 'python';
                      for (const [key, val] of Object.entries(languageMap)) {
                        if (val.toLowerCase() === entry.language.toLowerCase()) {
                          frontendLang = key;
                          break;
                        }
                      }
                      skipStarterLoad.current = true;
                      setLanguage(frontendLang);
                      setCode(entry.code);
                      if (onCodeChange) onCodeChange(entry.code);
                      onTabChange('code');
                      toast.success('Code loaded into editor');
                      setTimeout(() => { skipStarterLoad.current = false; }, 100);
                    }}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className={styles.resultsPanel}>
          {!results || results.length === 0 ? (
            <div className={styles.resultsEmpty}>Run your code to see results here.</div>
          ) : (
            <>
              <div className={styles.resultSummaryTop}>
                {passedCount} / {totalCount} passed
              </div>
              <div className={styles.resultsList}>
                {results.map((res, idx) => (
                  <div key={idx} className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <span className={res.passed ? styles.resultPassedIcon : styles.resultFailedIcon}>
                        {res.passed ? <FiCheckCircle /> : <FiXCircle />}
                      </span>
                      <span className={styles.resultLabel}>Test Case {idx + 1}</span>
                    </div>
                    <div className={styles.resultDetail}>
                      <div className={styles.resultDetailLabel}>Input:</div>
                      <pre className={styles.resultDetailValue}>{res.input}</pre>
                    </div>
                    <div className={styles.resultDetail}>
                      <div className={styles.resultDetailLabel}>Expected:</div>
                      <pre className={styles.resultDetailValue}>{res.expected}</pre>
                    </div>
                    <div className={styles.resultDetail}>
                      <div className={styles.resultDetailLabel}>Output:</div>
                      <pre className={styles.resultDetailValue}>{res.output}</pre>
                    </div>
                    {res.error && (
                      <div className={styles.resultError}>
                        <div className={styles.resultDetailLabel}>Error:</div>
                        <pre className={styles.resultErrorValue}>{res.error}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};