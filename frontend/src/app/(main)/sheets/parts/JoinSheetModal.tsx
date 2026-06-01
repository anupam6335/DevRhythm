'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import DatePicker from '@/shared/components/DatePicker';
import styles from './JoinSheetModal.module.css';

interface JoinSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetDate: string) => void;
  isLoading: boolean;
}

export default function JoinSheetModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: JoinSheetModalProps) {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!targetDate) {
      setError('Please select a target date');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      setError('Target date must be in the future');
      return;
    }
    setError(null);
    onConfirm(format(targetDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
  };

  const handleClose = () => {
    setTargetDate(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Join Sheet"
      size="sm"
      closeOnBackdropClick
      closeOnEsc
      showCloseButton
    >
      <div className={styles.modalContent}>
        <p className={styles.description}>
          Set your target completion date for this sheet. This will help you track your progress.
        </p>
        <div className={styles.dateField}>
          <label htmlFor="targetDate" className={styles.label}>
            Target Date *
          </label>
          <DatePicker
            selected={targetDate}
            onChange={(date: Date | null) => {
              setTargetDate(date);
              setError(null);
            }}
            placeholder="Select a future date"
            minDate={new Date()}
            dateFormat="yyyy-MM-dd"
            id="targetDate"
          />
          {error && <span className={styles.error}>{error}</span>}
        </div>
        <div className={styles.actions}>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} isLoading={isLoading}>
            Join Sheet
          </Button>
        </div>
      </div>
    </Modal>
  );
}