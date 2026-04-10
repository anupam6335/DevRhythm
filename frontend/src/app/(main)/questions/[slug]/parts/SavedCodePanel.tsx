'use client';

import React from 'react';
import CodeBlock from '@/shared/components/CodeBlock';
import Button from '@/shared/components/Button';
import type { SavedCode } from '@/shared/types';

interface SavedCodePanelProps {
  savedCode?: SavedCode;
  onLoad: (code: string) => void;
}

export const SavedCodePanel: React.FC<SavedCodePanelProps> = ({ savedCode, onLoad }) => {
  if (!savedCode) {
    return <p>No saved code yet. Write some code and run it to save.</p>;
  }

  return (
    <div>
      <CodeBlock code={savedCode.code} language={savedCode.language} showLineNumbers />
      <div style={{ marginTop: '0.5rem' }}>
        <Button size="sm" onClick={() => onLoad(savedCode.code)}>
          Load into Editor
        </Button>
      </div>
    </div>
  );
};