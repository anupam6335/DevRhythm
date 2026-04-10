'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiLink } from 'react-icons/fi';
import { useLeetCodeFetch } from '@/features/question';
import Loader from '@/shared/components/Loader';
import { toast } from '@/shared/components/Toast';
import styles from './LeetCodeUrlInput.module.css';

interface LeetCodeUrlInputProps {
  onFetch: (data: {
    title: string;
    difficulty: string;
    tags: string[];
    link: string;
    description?: string;
  }) => void;
  disabled?: boolean;
}

export const LeetCodeUrlInput: React.FC<LeetCodeUrlInputProps> = ({
  onFetch,
  disabled,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fetchMutation = useLeetCodeFetch();
  const lastFetchedUrlRef = useRef<string>('');
  const failedUrlRef = useRef<string>('');
  const fetchingUrlRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const validateAndFetch = useCallback(
    (urlToValidate: string) => {
      if (!urlToValidate) {
        setError(null);
        return;
      }

      const isValidLeetCodeUrl =
        /^https?:\/\/(www\.)?leetcode\.com\/problems\/[^/]+\/?/.test(
          urlToValidate
        );
      if (!isValidLeetCodeUrl) {
        setError('Please enter a valid LeetCode problem URL');
        return;
      }

      // Skip if the same URL was already fetched successfully
      if (lastFetchedUrlRef.current === urlToValidate) {
        return;
      }

      // Skip if the URL previously failed with a permanent error (e.g., 404)
      if (failedUrlRef.current === urlToValidate) {
        setError('This problem could not be found. Please check the URL.');
        return;
      }

      // Skip if we're already fetching the same URL
      if (fetchingUrlRef.current === urlToValidate) {
        return;
      }

      setError(null);
      fetchingUrlRef.current = urlToValidate;

      fetchMutation.mutate(urlToValidate, {
        onSuccess: (data) => {
          fetchingUrlRef.current = null;
          lastFetchedUrlRef.current = urlToValidate;
          failedUrlRef.current = '';
          onFetch(data);
          toast.success('Problem details fetched');
        },
        onError: (err: any) => {
          fetchingUrlRef.current = null;

          // Ignore cancellation errors
          if (err?.code === 'ERR_CANCELED' || err?.message?.includes('canceled')) {
            return;
          }

          // If it's a 404, mark the URL as permanently failed
          if (err.response?.status === 404) {
            failedUrlRef.current = urlToValidate;
            const errorMessage = 'Problem not found on LeetCode. Please check the URL.';
            setError(errorMessage);
            toast.error(errorMessage);
            return;
          }

          // For other errors (network, rate-limit, etc.) show generic message
          const errorMessage = err.message || 'Failed to fetch problem';
          setError(errorMessage);
          // Avoid duplicate toast for rate-limit (already handled in hook)
          if (err.response?.status !== 429) {
            toast.error(errorMessage);
          }
        },
      });
    },
    [fetchMutation, onFetch]
  );

  // Debounced fetch
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (url) {
      debounceTimeoutRef.current = setTimeout(() => {
        validateAndFetch(url);
      }, 500);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [url, validateAndFetch]);

  const handleBlur = () => {
    if (url) {
      validateAndFetch(url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // Reset success and failure tracking when the URL changes
    if (newUrl !== lastFetchedUrlRef.current) {
      lastFetchedUrlRef.current = '';
    }
    if (newUrl !== fetchingUrlRef.current) {
      fetchingUrlRef.current = null;
    }
    if (newUrl !== failedUrlRef.current) {
      failedUrlRef.current = '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <FiLink className={styles.linkIcon} />
        <input
          type="url"
          value={url}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="https://leetcode.com/problems/..."
          disabled={disabled || fetchMutation.isPending}
          className={styles.input}
        />
        {fetchMutation.isPending && <Loader size="sm" className={styles.spinner} />}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <p className={styles.hint}>Auto‑fetches when URL is valid</p>
    </div>
  );
};