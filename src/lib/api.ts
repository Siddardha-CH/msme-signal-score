import { MSMERecord } from './types';

const API_BASE = '/api';

function getToken(): string | null {
  try {
    const raw = localStorage.getItem('msme-auth-storage');
    return raw ? JSON.parse(raw)?.state?.token : null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('Invalid credentials');
  return response.json();
}

export async function fetchAllMSME(): Promise<MSMERecord[]> {
  const response = await fetch(`${API_BASE}/msme`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to fetch MSME records');
  return response.json();
}

export async function fetchMSME(gstin: string): Promise<MSMERecord> {
  const response = await fetch(`${API_BASE}/msme/${gstin}`, { headers: authHeaders() });
  if (!response.ok) {
    if (response.status === 404) throw new Error('MSME not found');
    throw new Error('Failed to fetch MSME data');
  }
  return response.json();
}

export async function createMSME(record: Omit<MSMERecord, 'last_updated'>): Promise<MSMERecord> {
  const response = await fetch(`${API_BASE}/msme`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).message || 'Failed to create MSME record');
  }
  return response.json();
}

export async function updateMSME(gstin: string, updates: Partial<MSMERecord>): Promise<MSMERecord> {
  const response = await fetch(`${API_BASE}/msme/${gstin}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as any).message || 'Failed to update MSME record');
  }
  return response.json();
}

export interface ScoreResult {
  gstin: string;
  business_name: string;
  score: number;
  confidence: number;
  grade: string;
  factors: Record<string, number>;
}

export async function fetchMLScore(gstin: string): Promise<ScoreResult> {
  const response = await fetch(`${API_BASE}/msme/score/${gstin}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Failed to fetch score');
  return response.json();
}

export interface AppUser {
  username: string;
  role: string;
}

// Legacy compatibility — re-export MLScoreResult alias
export type MLScoreResult = ScoreResult;

export async function fetchUsers(): Promise<AppUser[]> {
  const response = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
  if (!response.ok) return [];
  return response.json();
}

export async function createUser(username: string, password: string, role: string): Promise<AppUser> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, password, role }),
  });
  if (!response.ok) throw new Error('Failed to create user');
  return response.json();
}

export async function deleteUser(username: string): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${username}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete user');
}
