// CSV-backed MSME Signal Store
// Treats CSV as a batch data source with read/write capabilities

import { MSMERecord } from './types';
import { getCurrentDateString } from './scoring-engine';

const CSV_PATH = '/data/msme_batch_signal_store_with_month.csv';
const STORAGE_KEY = 'msme_data_store';

// Parse CSV string to records
function parseCSV(csvText: string): MSMERecord[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const records: MSMERecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;

    const record: MSMERecord = {
      gstin: values[0],
      business_name: values[1],
      established_year: parseInt(values[2]),
      gst_compliance: values[3] as MSMERecord['gst_compliance'],
      utility_punctuality: values[4] as MSMERecord['utility_punctuality'],
      upi_frequency: values[5] as MSMERecord['upi_frequency'],
      digital_presence: values[6] as MSMERecord['digital_presence'],
      location_stability: values[7] as MSMERecord['location_stability'],
      last_updated: values[8],
    };

    records.push(record);
  }

  return records;
}

// Convert records to CSV string
function recordsToCSV(records: MSMERecord[]): string {
  const headers = [
    'gstin',
    'business_name',
    'established_year',
    'gst_compliance',
    'utility_punctuality',
    'upi_frequency',
    'digital_presence',
    'location_stability',
    'last_updated',
  ];

  const lines = [headers.join(',')];

  for (const record of records) {
    const values = [
      record.gstin,
      record.business_name,
      record.established_year.toString(),
      record.gst_compliance,
      record.utility_punctuality,
      record.upi_frequency,
      record.digital_presence,
      record.location_stability,
      record.last_updated,
    ];
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

// Initialize store from CSV file or localStorage
export async function initializeStore(): Promise<MSMERecord[]> {
  // Check localStorage first for any updates
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to fetch
    }
  }

  // Fetch from CSV file
  try {
    const response = await fetch(CSV_PATH);
    if (!response.ok) throw new Error('Failed to fetch CSV');
    const csvText = await response.text();
    const records = parseCSV(csvText);
    
    // Store in localStorage for future updates
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    
    return records;
  } catch (error) {
    console.error('Error loading CSV:', error);
    return [];
  }
}

// Get all records
export function getAllRecords(): MSMERecord[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Find record by GSTIN
export function findByGSTIN(gstin: string): MSMERecord | null {
  const records = getAllRecords();
  return records.find((r) => r.gstin.toUpperCase() === gstin.toUpperCase()) || null;
}

// Add new record
export function addRecord(record: Omit<MSMERecord, 'last_updated'>): MSMERecord {
  const records = getAllRecords();
  
  // Check if already exists
  const existing = records.find((r) => r.gstin.toUpperCase() === record.gstin.toUpperCase());
  if (existing) {
    throw new Error('MSME with this GSTIN already exists');
  }

  const newRecord: MSMERecord = {
    ...record,
    last_updated: getCurrentDateString(),
  };

  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  
  return newRecord;
}

// Update existing record
export function updateRecord(
  gstin: string,
  updates: Partial<Omit<MSMERecord, 'gstin' | 'established_year' | 'last_updated'>>
): MSMERecord {
  const records = getAllRecords();
  const index = records.findIndex((r) => r.gstin.toUpperCase() === gstin.toUpperCase());
  
  if (index === -1) {
    throw new Error('MSME record not found');
  }

  const updatedRecord: MSMERecord = {
    ...records[index],
    ...updates,
    last_updated: getCurrentDateString(),
  };

  records[index] = updatedRecord;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  
  return updatedRecord;
}

// Export current data as CSV (for download)
export function exportToCSV(): string {
  const records = getAllRecords();
  return recordsToCSV(records);
}

// Validate GSTIN format (basic validation)
export function isValidGSTIN(gstin: string): boolean {
  // GSTIN format: 2 digits + 10 char PAN + 1 digit + 1 char + 1 alphanumeric
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/i;
  return gstinRegex.test(gstin.trim());
}
