'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateSheet, useImportSheet } from '@/features/sheets';
import { ROUTES } from '@/shared/config';
import Tabs from '@/shared/components/Tabs';
import Button from '@/shared/components/Button';
import ManualTab from './ManualTab';
import ImportTab from './ImportTab';
import ClearDraftModal from './ClearDraftModal';
import styles from './CreateSheetWrapper.module.css';

const MANUAL_DRAFT_KEY = 'sheet_create_draft_manual';
const IMPORT_DRAFT_KEY = 'sheet_create_draft_import';

export function CreateSheetWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [isLoaded, setIsLoaded] = useState(false);
  const [manualInitialData, setManualInitialData] = useState<any>(null);
  const [importInitialData, setImportInitialData] = useState<any>(null);
  const [clearDraftModalOpen, setClearDraftModalOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0); // Used to force remount

  const createMutation = useCreateSheet();
  const importMutation = useImportSheet();

  useEffect(() => {
    const resetParam = searchParams.get('reset');
    if (resetParam === 'true') {
      localStorage.removeItem(MANUAL_DRAFT_KEY);
      localStorage.removeItem(IMPORT_DRAFT_KEY);
      setManualInitialData(null);
      setImportInitialData(null);
    } else {
      const manualDraft = localStorage.getItem(MANUAL_DRAFT_KEY);
      const importDraft = localStorage.getItem(IMPORT_DRAFT_KEY);
      if (manualDraft) setManualInitialData(JSON.parse(manualDraft));
      if (importDraft) setImportInitialData(JSON.parse(importDraft));
    }
    setIsLoaded(true);
  }, [searchParams]);

  const clearDrafts = () => {
    localStorage.removeItem(MANUAL_DRAFT_KEY);
    localStorage.removeItem(IMPORT_DRAFT_KEY);
    setManualInitialData(null);
    setImportInitialData(null);
  };

  const handleClearDraftConfirm = () => {
    clearDrafts();
    setClearDraftModalOpen(false);
    setResetKey(prev => prev + 1); // force remount of both tabs
  };

  const handleManualSubmit = async (data: any) => {
    const result = await createMutation.mutateAsync(data);
    const slug = result?.sheet?.slug;
    clearDrafts();
    if (slug) {
      router.push(ROUTES.SHEETS.DETAIL(slug));
    } else {
      router.push(ROUTES.SHEETS.ROOT);
    }
  };

  const handleImportSubmit = async (formData: FormData) => {
    const result = await importMutation.mutateAsync(formData);
    const slug = result?.sheet?.slug;
    clearDrafts();
    if (slug) {
      router.push(ROUTES.SHEETS.DETAIL(slug));
    } else {
      router.push(ROUTES.SHEETS.ROOT);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.SHEETS.ROOT);
  };

  const isSubmitting = createMutation.isPending || importMutation.isPending;

  if (!isLoaded) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tabs
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'manual' | 'import')}
          tabs={[
            { id: 'manual', label: 'Manual' },
            { id: 'import', label: 'Import' },
          ]}
          className={styles.tabs}
        />
        <Button variant="ghost" size="sm" onClick={() => setClearDraftModalOpen(true)} className={styles.clearBtn}>
          Clear Draft
        </Button>
      </div>

      <div className={styles.content}>
        {activeTab === 'manual' && (
          <ManualTab
            key={`manual-${resetKey}`}
            initialData={manualInitialData}
            onSuccess={clearDrafts}
            onSubmit={handleManualSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            draftKey={MANUAL_DRAFT_KEY}
          />
        )}
        {activeTab === 'import' && (
          <ImportTab
            key={`import-${resetKey}`}
            initialData={importInitialData}
            onSuccess={clearDrafts}
            onSubmit={handleImportSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            draftKey={IMPORT_DRAFT_KEY}
          />
        )}
      </div>

      <ClearDraftModal
        isOpen={clearDraftModalOpen}
        onClose={() => setClearDraftModalOpen(false)}
        onConfirm={handleClearDraftConfirm}
      />
    </div>
  );
}