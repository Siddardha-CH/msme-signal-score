// React hook for MSME data store

import { useState, useEffect, useCallback } from 'react';
import { MSMERecord } from '@/lib/types';
import { fetchMSME, createMSME, updateMSME } from '@/lib/api';

// Cache for the current session to avoid infinite loading states
let currentRecordCache: MSMERecord | null = null;
let isInitialized = false;

export function useMSMEStore() {
  const [records, setRecords] = useState<MSMERecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We no longer initialize all records on mount since it's a real DB.
  useEffect(() => {
    // Just a placeholder if we ever add a "recent searches" feature
  }, []);

  const refresh = useCallback(() => {}, []);

  // Find by GSTIN - now async from real API
  const find = async (gstin: string): Promise<MSMERecord | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMSME(gstin);
      currentRecordCache = data;
      return data;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sync find for components that haven't been refactored to async yet
  const findSync = (gstin: string): MSMERecord | null => {
      // Just returns whatever is in memory, meant to be called after `find` completes
      return currentRecordCache?.gstin.toUpperCase() === gstin.toUpperCase() ? currentRecordCache : null;
  };

  // Add new record
  const add = async (record: Omit<MSMERecord, 'last_updated'>): Promise<MSMERecord> => {
      setIsLoading(true);
      try {
        const newRecord = await createMSME(record);
        currentRecordCache = newRecord;
        return newRecord;
      } catch (err: any) {
          setError(err.message || "Failed to create");
          throw err;
      } finally {
          setIsLoading(false);
      }
  };

  // Update existing record
  const update = async (
    gstin: string,
    updates: Partial<Omit<MSMERecord, 'gstin' | 'established_year' | 'last_updated'>>
  ): Promise<MSMERecord> => {
      setIsLoading(true);
      try {
          const updated = await updateMSME(gstin, updates);
          currentRecordCache = updated;
          return updated;
      } catch (err: any) {
          setError(err.message || "Failed to update");
          throw err;
      } finally {
          setIsLoading(false);
      }
  };

  return {
    records,
    isLoading,
    error,
    find,
    findSync,
    add,
    update,
    refresh,
  };
}
