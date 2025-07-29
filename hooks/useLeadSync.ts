// /hooks/useLeadSync.ts

import { useState, useCallback } from 'react';
import { SyncResult } from '@/types/facebook';

interface UseLeadSyncReturn {
  syncLeads: (userId: string) => Promise<SyncResult>;
  loading: boolean;
  error: string | null;
  lastResult: SyncResult | null;
  clearError: () => void;
}

export const useLeadSync = (): UseLeadSyncReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncLeads = useCallback(async (userId: string): Promise<SyncResult> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/facebook/aggregateLeads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const result: SyncResult | { error: string; details?: string } = await response.json();

      if (!response.ok || 'error' in result) {
        const errorMsg = 'error' in result ? result.error : 'Sync failed';
        throw new Error(errorMsg);
      }

      setLastResult(result);
      return result;

    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred during sync';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    syncLeads,
    loading,
    error,
    lastResult,
    clearError
  };
};

// Additional hook for fetching forms
interface UseFetchFormsReturn {
  fetchForms: (userId: string) => Promise<any>;
  loading: boolean;
  error: string | null;
  forms: any[];
}

export const useFetchForms = (): UseFetchFormsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<any[]>([]);

  const fetchForms = useCallback(async (userId: string) => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/facebook/fetchForms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch forms');
      }

      setForms(result.forms || []);
      return result;

    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred while fetching forms';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchForms,
    loading,
    error,
    forms
  };
};