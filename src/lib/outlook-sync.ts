// Client-side helper to trigger Outlook sync from any component.
// Passes Firebase uid to API routes for per-user token lookup.

import { Job } from '@/types/job';
import { getUidSafe } from './auth-helpers';

export async function syncJobToOutlook(
  job: Job,
  action: 'create' | 'update' | 'delete' = 'create'
): Promise<{ success: boolean; action?: string; error?: string }> {
  const uid = getUidSafe();
  if (!uid) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch('/api/outlook/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, job, uid }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.warn('Outlook sync failed:', data.error);
      return { success: false, error: data.error };
    }
    return data;
  } catch (error) {
    console.warn('Outlook sync error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function checkOutlookConnection(): Promise<{ connected: boolean; email: string }> {
  const uid = getUidSafe();
  if (!uid) return { connected: false, email: '' };

  try {
    const response = await fetch(`/api/outlook/sync?uid=${uid}`);
    if (!response.ok) return { connected: false, email: '' };
    return await response.json();
  } catch {
    return { connected: false, email: '' };
  }
}

export function connectOutlook(): void {
  const uid = getUidSafe();
  if (!uid) { console.error('Not authenticated'); return; }
  window.location.href = `/api/auth/outlook?uid=${uid}`;
}

export async function disconnectOutlookClient(): Promise<boolean> {
  const uid = getUidSafe();
  if (!uid) return false;

  try {
    const response = await fetch('/api/outlook/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    return response.ok;
  } catch {
    return false;
  }
}