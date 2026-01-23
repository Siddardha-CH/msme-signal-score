// React hook for MSME data store

import { useState, useEffect, useCallback } from 'react';
import { MSMERecord } from '@/lib/types';
import {
  initializeStore,
  getAllRecords,
  findByGSTIN,
  addRecord,
  updateRecord,
} from '@/lib/csv-store';

// Global initialization promise to prevent multiple fetches
let initPromise: Promise<MSMERecord[]> | null = null;
let isInitialized = false;

export function useMSMEStore() {
  const [records, setRecords] = useState<MSMERecord[]>([]);
  const [isLoading, setIsLoading] = useState(!isInitialized);
  const [error, setError] = useState<string | null>(null);

  // Initialize store on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (!isInitialized) {
          setIsLoading(true);
          if (!initPromise) {
            initPromise = initializeStore();
          }
          const data = await initPromise;
          setRecords(data);
          isInitialized = true;
        } else {
          setRecords(getAllRecords());
        }
        setError(null);
      } catch (err) {
        setError('Failed to load MSME data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Refresh records from localStorage
  const refresh = useCallback(() => {
    const data = getAllRecords();
    setRecords(data);
  }, []);

  // Find by GSTIN - now returns from current records state
  const find = useCallback((gstin: string): MSMERecord | null => {
    // Use localStorage directly to ensure we have latest data
    return findByGSTIN(gstin);
  }, []);

  // Add new record
  const add = useCallback(
    (record: Omit<MSMERecord, 'last_updated'>): MSMERecord => {
      const newRecord = addRecord(record);
      refresh();
      return newRecord;
    },
    [refresh]
  );

  // Update existing record
  const update = useCallback(
    (
      gstin: string,
      updates: Partial<Omit<MSMERecord, 'gstin' | 'established_year' | 'last_updated'>>
    ): MSMERecord => {
      const updatedRecord = updateRecord(gstin, updates);
      refresh();
      return updatedRecord;
    },
    [refresh]
  );

  return {
    records,
    isLoading,
    error,
    find,
    add,
    update,
    refresh,
  };
}
