'use client';

import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import styles from './LeaveSheetModal.module.css';

interface LeaveSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetName: string;
  onConfirm: () => void;
  isLoading: boolean;
}

export default function LeaveSheetModal({
  isOpen,
  onClose,
  sheetName,
  onConfirm,
  isLoading,
}: LeaveSheetModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leave Sheet"
      size="sm"
      closeOnBackdropClick
      closeOnEsc
      showCloseButton
    >
      <div className={styles.modalContent}>
        <p className={styles.warning}>
          Are you sure you want to leave <strong>"{sheetName}"</strong>?
        </p>
        <p className={styles.description}>
          Your progress will be permanently deleted. You can rejoin later, but your previous progress will not be restored.
        </p>
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="error" onClick={onConfirm} isLoading={isLoading}>
            Leave Sheet
          </Button>
        </div>
      </div>
    </Modal>
  );
}