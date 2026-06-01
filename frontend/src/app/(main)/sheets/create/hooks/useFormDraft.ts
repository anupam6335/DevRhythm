'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useDebounceCallback } from '@/shared/hooks';

const DRAFT_KEY = 'sheet_create_draft';

export interface DraftData {
  activeTab: 'manual' | 'import';
  manualData: {
    name: string;
    description: string;
    targetDate: string | null;
    specialTag: string;
    originalSourceName: string;
    originalSourceUrl: string;
    selectedQuestions: Array<{ id: string; title: string }>;
  };
  importData: {
    sheetName: string;
    description: string;
    targetDate: string | null;
    specialTag: string;
    originalSourceName: string;
    originalSourceUrl: string;
    fileName: string | null;
  };
  version: number;
}

const CURRENT_VERSION = 1;

const defaultDraft: DraftData = {
  activeTab: 'manual',
  manualData: {
    name: '',
    description: '',
    targetDate: null,
    specialTag: '',
    originalSourceName: '',
    originalSourceUrl: '',
    selectedQuestions: [],
  },
  importData: {
    sheetName: '',
    description: '',
    targetDate: null,
    specialTag: '',
    originalSourceName: '',
    originalSourceUrl: '',
    fileName: null,
  },
  version: CURRENT_VERSION,
};

// Synchronous save to localStorage (no debounce)
function saveToLocalStorage(draft: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

export function useFormDraft() {
  const lastDraftRef = useRef<DraftData | null>(null);
  const saveImmediate = useCallback((draft: DraftData) => {
    lastDraftRef.current = draft;
    saveToLocalStorage(draft);
  }, []);

  const saveDebounced = useDebounceCallback((draft: DraftData) => {
    lastDraftRef.current = draft;
    saveToLocalStorage(draft);
  }, 500);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== CURRENT_VERSION) {
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }
      lastDraftRef.current = parsed;
      return parsed;
    } catch {
      return null;
    }
  }, []);

  // For text inputs (debounced)
  const saveDraft = useCallback((draft: DraftData, immediate = false) => {
    if (immediate) {
      saveImmediate(draft);
    } else {
      saveDebounced(draft);
    }
  }, [saveImmediate, saveDebounced]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      lastDraftRef.current = null;
    } catch (error) {
      console.warn('Failed to clear draft from localStorage:', error);
    }
  }, []);

  // Save on page unload (refresh, close) – uses last known draft
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastDraftRef.current) {
        saveToLocalStorage(lastDraftRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return { loadDraft, saveDraft, clearDraft, defaultDraft };
}