import { useMutation } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { questionService } from '../services/questionService';
import { toast } from '@/shared/components/Toast';

export function useLeetCodeFetch() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [cooldownTimer, setCooldownTimer] = useState<NodeJS.Timeout | null>(null);

  // Cancel any ongoing request when a new one starts
  const cancelPrevious = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (cooldownTimer) {
        clearTimeout(cooldownTimer);
      }
    };
  }, [cooldownTimer]);

  return useMutation({
    mutationFn: async (url: string) => {
      // If we're in cooldown, reject immediately
      if (retryAfter && retryAfter > Date.now()) {
        const waitSeconds = Math.ceil((retryAfter - Date.now()) / 1000);
        throw new Error(`Rate limited. Please wait ${waitSeconds} seconds before retrying.`);
      }
      cancelPrevious();
      return questionService.fetchLeetCodeQuestion(url, abortControllerRef.current?.signal);
    },
    onError: (error: any) => {
      // Handle 429 rate limit
      if (error.response?.status === 429) {
        const retryAfterHeader = error.response?.headers?.['retry-after'];
        let waitSeconds = 60; // fallback to 60 seconds
        if (retryAfterHeader && !isNaN(parseInt(retryAfterHeader))) {
          waitSeconds = parseInt(retryAfterHeader);
        }
        const retryTimestamp = Date.now() + waitSeconds * 1000;
        setRetryAfter(retryTimestamp);

        // Clear any existing cooldown timer
        if (cooldownTimer) {
          clearTimeout(cooldownTimer);
        }
        const timer = setTimeout(() => setRetryAfter(null), waitSeconds * 1000);
        setCooldownTimer(timer);

        toast.error(`Too many requests. Please wait ${waitSeconds} seconds.`);
      } else {
        toast.error(error.message || 'Failed to fetch LeetCode problem');
      }
    },
  });
}