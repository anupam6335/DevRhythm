'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiLink } from 'react-icons/fi';
import { useLeetCodeFetch } from '../hooks/useLeetCodeFetch';
import Input from '@/shared/components/Input';
import Loader from '@/shared/components/Loader';
import { toast } from '@/shared/components/Toast';
import styles from './LeetCodeUrlInput.module.css';

interface LeetCodeUrlInputProps {
  onFetch: (data: { title: string; difficulty: string; tags: string[]; link: string }) => void;
  disabled?: boolean;
}

export const LeetCodeUrlInput: React.FC<LeetCodeUrlInputProps> = ({ onFetch, disabled }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fetchMutation = useLeetCodeFetch();

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

    setError(null);
    fetchMutation.mutate(urlToValidate, {
      onSuccess: (data) => {
        onFetch(data);
        toast.success('Problem details fetched');
        setError(null);
      },
      onError: (err: any) => {
        setError(err.message || 'Failed to fetch problem');
        toast.error(err.message || 'Failed to fetch problem');
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

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <FiLink className={styles.linkIcon} />
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleBlur}
          placeholder="https://leetcode.com/problems/..."
          disabled={disabled || fetchMutation.isPending}
          fullWidth
          className={styles.input}
        />
        {fetchMutation.isPending && <Loader size="sm" className={styles.spinner} />}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
      <p className={styles.hint}>Auto‑fetches when URL is valid</p>
    </div>
  );
};