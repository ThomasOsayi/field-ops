// Client-side helper to trigger Outlook sync from any component
// These call the API routes which handle the actual Graph API calls

import { Job } from '@/types/job';

export async function syncJobToOutlook(job: Job, action: 'create' | 'update' | 'delete' = 'create'): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    const response = await fetch('/api/outlook/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, job }),
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
  try {
    const response = await fetch('/api/outlook/sync');
    if (!response.ok) return { connected: false, email: '' };
    return await response.json();
  } catch {
    return { connected: false, email: '' };
  }
}

export function connectOutlook(): void {
  window.location.href = '/api/auth/outlook';
}

export async function disconnectOutlookClient(): Promise<boolean> {
  try {
    const response = await fetch('/api/outlook/disconnect', { method: 'POST' });
    return response.ok;
  } catch {
    return false;
  }
}