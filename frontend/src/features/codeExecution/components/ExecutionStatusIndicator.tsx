import React, { useEffect, useState } from 'react';
import { FiPackage, FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import styles from './ExecutionStatusIndicator.module.css';

export type ExecutionStatus =
  | 'idle'
  | 'queued'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

interface ExecutionStatusIndicatorProps {
  status: ExecutionStatus;
  onHide?: () => void;
  className?: string;
}

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

// Define only three steps: Queued, Processing, Completed
// Failed will replace Completed when needed
const steps: Step[] = [
  { id: 'queued', label: 'Queued', icon: <FiPackage /> },
  { id: 'processing', label: 'Processing', icon: <FiLoader /> },
  { id: 'completed', label: 'Completed', icon: <FiCheckCircle /> },
];

const failedStep: Step = { id: 'failed', label: 'Failed', icon: <FiXCircle /> };

// Helper to map backend status to UI step index
function getUIStepFromStatus(status: ExecutionStatus): { stepId: string; isFailed: boolean } {
  if (status === 'failed') return { stepId: 'failed', isFailed: true };
  if (status === 'completed') return { stepId: 'completed', isFailed: false };
  if (status === 'queued') return { stepId: 'queued', isFailed: false };
  // For 'pending' and 'processing', both map to 'processing' step
  return { stepId: 'processing', isFailed: false };
}

export const ExecutionStatusIndicator: React.FC<ExecutionStatusIndicatorProps> = ({
  status,
  onHide,
  className = '',
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (status === 'idle') {
      setVisible(false);
      return;
    }
    setVisible(true);
    if (status === 'completed' || status === 'failed') {
      const delay = status === 'completed' ? 1000 : 2000;
      const timer = setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [status, onHide]);

  if (!visible || status === 'idle') return null;

  const { stepId, isFailed } = getUIStepFromStatus(status);

  // If failed, show only the failed step
  if (isFailed) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={`${styles.step} ${styles.failedStep}`}>
          <span className={styles.icon}>{failedStep.icon}</span>
          <span className={styles.label}>{failedStep.label}</span>
        </div>
      </div>
    );
  }

  // Find the index of the current step (queued, processing, or completed)
  let activeIndex = steps.findIndex(s => s.id === stepId);
  if (activeIndex === -1) activeIndex = 1; // fallback to processing

  return (
    <div className={`${styles.container} ${className}`}>
      {steps.map((step, idx) => {
        const isActive = idx === activeIndex;
        const isPast = idx < activeIndex;
        const isFuture = idx > activeIndex;

        let stepClass = styles.step;
        if (isActive) stepClass = `${styles.step} ${styles.activeStep}`;
        else if (isPast) stepClass = `${styles.step} ${styles.completedStep}`;
        else if (isFuture) stepClass = `${styles.step} ${styles.futureStep}`;

        const icon = isPast ? <FiCheckCircle /> : step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className={stepClass}>
              <span className={styles.icon}>{icon}</span>
              <span className={styles.label}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <span className={styles.arrow}>→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};