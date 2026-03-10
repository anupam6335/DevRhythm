import React from 'react';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';

interface AddProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProgressModal: React.FC<AddProgressModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Solved Question">
      <div style={{ padding: '1rem 0' }}>
        <p>Form to add a solved question will go here.</p>
        <p>It will include search, manual entry, and quick inputs.</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onClose}>
          Save
        </Button>
      </div>
    </Modal>
  );
};