'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/shared/components/Modal';
import Button from '@/shared/components/Button';
import styles from './GoalCreationReminder.module.css';

// Progressive intervals in minutes
const INTERVALS = [1, 5, 10, 30, 60, 120, 240];

const STORAGE_KEY = 'goal_reminder_state';

interface ReminderState {
  intervalIndex: number;
  lastReminderShown: number | null;
  goalCreatedTimestamp: number | null;
}

export default function GoalCreationReminder() {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const loadState = useCallback((): ReminderState => {
    if (typeof window === 'undefined') return { intervalIndex: 0, lastReminderShown: null, goalCreatedTimestamp: null };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { intervalIndex: 0, lastReminderShown: null, goalCreatedTimestamp: null };
      }
    }
    return { intervalIndex: 0, lastReminderShown: null, goalCreatedTimestamp: null };
  }, []);

  const saveState = useCallback((state: ReminderState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const disableReminders = useCallback(() => {
    const state = loadState();
    state.goalCreatedTimestamp = Date.now();
    saveState(state);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [loadState, saveState]);

  const scheduleNextReminder = useCallback(() => {
    const state = loadState();
    if (state.goalCreatedTimestamp) return;

    const currentIndex = state.intervalIndex;
    const nextDelayMinutes = INTERVALS[currentIndex] || INTERVALS[INTERVALS.length - 1];
    const nextDelayMs = nextDelayMinutes * 60 * 1000;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const latestState = loadState();
      if (!latestState.goalCreatedTimestamp) {
        setIsOpen(true);
        const updatedState = { ...latestState, lastReminderShown: Date.now() };
        saveState(updatedState);
      }
    }, nextDelayMs);
  }, [loadState, saveState]);

  const handleGoalCreated = useCallback(() => {
    disableReminders();
    setIsOpen(false);
  }, [disableReminders]);

  const handleRemindLater = () => {
    setIsOpen(false);
    const state = loadState();
    const nextIndex = Math.min(state.intervalIndex + 1, INTERVALS.length - 1);
    const newState = { ...state, intervalIndex: nextIndex };
    saveState(newState);
    scheduleNextReminder();
  };

  const handleCreateGoal = () => {
    disableReminders();
    setIsOpen(false);
    router.push('/goals/create');
  };

  useEffect(() => {
    const listener = () => handleGoalCreated();
    if (typeof window !== 'undefined') {
      window.addEventListener('goalCreated', listener);
      return () => window.removeEventListener('goalCreated', listener);
    }
  }, [handleGoalCreated]);

  useEffect(() => {
    const state = loadState();
    const isRecentGoal = state.goalCreatedTimestamp && (Date.now() - state.goalCreatedTimestamp) < 60 * 60 * 1000;
    if (!isRecentGoal && !state.goalCreatedTimestamp) {
      scheduleNextReminder();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadState, scheduleNextReminder]);

  const currentInterval = INTERVALS[loadState().intervalIndex] || 30;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRemindLater}
      title="✨ Create a new goal"
      size="sm"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="outline" size="sm" onClick={handleRemindLater}>
            Remind me later
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateGoal}>
            Create goal
          </Button>
        </div>
      }
    >
      <p className={styles.message}>
        Stay on track! Setting a new daily or weekly goal helps you maintain momentum.
      </p>
      <p className={styles.submessage}>
        Click &quot;Create goal&quot; to set your next target, or &quot;Remind me later&quot; to be reminded again in {currentInterval} minutes.
      </p>
    </Modal>
  );
}