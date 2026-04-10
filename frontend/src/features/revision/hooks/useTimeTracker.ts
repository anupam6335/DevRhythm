import { useEffect, useRef, useCallback } from 'react';
import { tokenStorage } from '@/features/auth/utils/tokenStorage';

export function useTimeTracker(questionId: string | undefined, enabled: boolean) {
  const sentRef = useRef<boolean>(false);

  const sendTime = useCallback(() => {
    if (!enabled || sentRef.current) return;

    const storedStart = sessionStorage.getItem(`time-tracker-start-${questionId}`);
    if (!storedStart) return;

    const minutes = Math.floor((Date.now() - parseInt(storedStart, 10)) / 60000);
    if (minutes <= 0) return;

    sentRef.current = true;
    const payload = JSON.stringify({ minutes });
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const url = `${baseUrl}/revisions/${questionId}/time-spent`;
    const token = tokenStorage.getToken();

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: payload,
      keepalive: true,
    }).catch((err) => {
      console.warn('Failed to send time tracking:', err);
    }).finally(() => {
      sessionStorage.removeItem(`time-tracker-start-${questionId}`);
    });
  }, [enabled, questionId]);

  useEffect(() => {
    if (!enabled || !questionId) return;

    const existingStart = sessionStorage.getItem(`time-tracker-start-${questionId}`);
    if (!existingStart) {
      sessionStorage.setItem(`time-tracker-start-${questionId}`, Date.now().toString());
    }

    const handleBeforeUnload = () => sendTime();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, questionId, sendTime]);
}