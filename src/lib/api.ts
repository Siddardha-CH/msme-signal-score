import { MSMERecord } from './types';
import { useAuthStore } from '@/hooks/use-auth';

const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchMSME(gstin: string): Promise<MSMERecord> {
  const response = await fetch(`${API_BASE_URL}/msme/${gstin}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('MSME not found');
    }
    throw new Error('Failed to fetch MSME data');
  }
  return response.json();
}

export async function createMSME(record: Omit<MSMERecord, 'last_updated'>): Promise<MSMERecord> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}/msme`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create MSME record');
  }

  return response.json();
}

export async function updateMSME(gstin: string, updates: Partial<MSMERecord>): Promise<MSMERecord> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}/msme/${gstin}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update MSME record');
  }

  return response.json();
}

export interface MLScoreResult {
  status: string;
  gstin: string;
  predicted_score: number;
  ml_metadata: {
    model_type: string;
    prediction_confidence: number;
    version: string;
  };
}

export async function fetchMLScore(gstin: string): Promise<MLScoreResult> {
  const response = await fetch(`${API_BASE_URL}/score/${gstin}`);
  if (!response.ok) {
    throw new Error('Failed to fetch ML score prediction');
  }
  return response.json();
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  return response.json();
}

export interface AppUser {
  username: string;
  role: string;
  full_name?: string;
  email?: string;
}

export async function fetchUsers(): Promise<AppUser[]> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function createUser(username: string, password: string, role: string): Promise<AppUser> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ username, password, role })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create user');
  }
  return response.json();
}

export async function deleteUser(username: string): Promise<void> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_BASE_URL}/users/${username}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete user');
}
