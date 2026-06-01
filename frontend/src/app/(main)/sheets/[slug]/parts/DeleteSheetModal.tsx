'use client';

import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import styles from './DeleteSheetModal.module.css';

interface DeleteSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetName: string;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function DeleteSheetModal({
  isOpen,
  onClose,
  sheetName,
  onConfirm,
  isLoading,
}: DeleteSheetModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Sheet"
      size="sm"
      closeOnBackdropClick
      closeOnEsc
      showCloseButton
    >
      <div className={styles.modalContent}>
        <p className={styles.warning}>
          Are you sure you want to delete <strong>"{sheetName}"</strong>?
        </p>
        <p className={styles.description}>
          You will be removed as the owner. Your progress will be deleted, but the sheet will remain accessible to other participants. You can rejoin later as a normal participant, but your previous progress will not be restored.
        </p>
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="error" onClick={onConfirm} isLoading={isLoading}>
            Delete Sheet
          </Button>
        </div>
      </div>
    </Modal>
  );
}