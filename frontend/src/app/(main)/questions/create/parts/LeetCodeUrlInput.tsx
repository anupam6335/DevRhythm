'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiLink } from 'react-icons/fi';
import { useLeetCodeFetch } from '@/features/question';
import Loader from '@/shared/components/Loader';
import { toast } from '@/shared/components/Toast';
import styles from './LeetCodeUrlInput.module.css';

interface LeetCodeUrlInputProps {
  onFetch: (data: { title: string; difficulty: string; tags: string[]; link: string; description?: string }) => void;
  disabled?: boolean;
}

export const LeetCodeUrlInput: React.FC<LeetCodeUrlInputProps> = ({ onFetch, disabled }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fetchMutation = useLeetCodeFetch();
  const lastFetchedUrlRef = useRef<string>('');

  const validateAndFetch = useCallback((urlToValidate: string) => {
    if (!urlToValidate) {
      setError(null);
      return;
    }

    const isValidLeetCodeUrl = /^https?:\/\/(www\.)?leetcode\.com\/problems\/[^/]+\/?/.test(urlToValidate);
    if (!isValidLeetCodeUrl) {
      setError('Please enter a valid LeetCode problem URL');
      return;
    }

    // Skip if same URL already fetched successfully
    if (lastFetchedUrlRef.current === urlToValidate) {
      return;
    }

    setError(null);
    fetchMutation.mutate(urlToValidate, {
      onSuccess: (data) => {
        lastFetchedUrlRef.current = urlToValidate;
        onFetch(data);
        toast.success('Problem details fetched');
      },
      onError: (err: any) => {
        setError(err.message || 'Failed to fetch problem');
        toast.error(err.message || 'Failed to fetch problem');
        // Do not update lastFetchedUrlRef on error, allow retry
      },
    });
  }, [fetchMutation, onFetch]);

  // Debounced fetch
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (url) {
        validateAndFetch(url);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [url, validateAndFetch]);

  const handleBlur = () => {
    if (url) {
      validateAndFetch(url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    // Reset last fetched URL if the input changes to a different URL
    if (newUrl !== lastFetchedUrlRef.current) {
      lastFetchedUrlRef.current = '';
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