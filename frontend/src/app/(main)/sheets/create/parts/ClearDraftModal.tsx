'use client';

import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import styles from './ClearDraftModal.module.css';

interface ClearDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ClearDraftModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ClearDraftModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clear Draft"
      size="sm"
      closeOnBackdropClick
      closeOnEsc
      showCloseButton
    >
      <div className={styles.modalContent}>
        <p className={styles.warning}>
          Are you sure you want to clear all unsaved data?
        </p>
        <p className={styles.description}>
          This action cannot be undone. All entered information will be permanently lost.
        </p>
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="error" onClick={onConfirm} isLoading={isLoading}>
            Clear Draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}