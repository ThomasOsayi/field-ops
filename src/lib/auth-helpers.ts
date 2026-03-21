import { auth } from './firebase';

/**
 * Get the current Firebase Auth user's UID.
 * Only call from client-side code after ProtectedRoute has confirmed auth.
 */
export function getUid(): string {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
}

/**
 * Build a Firestore path scoped to the current user.
 * e.g. getUserPath('jobs') → 'users/abc123/jobs'
 */
export function getUserPath(subcollection: string): string {
  return `users/${getUid()}/${subcollection}`;
}

/**
 * Safe version — returns null instead of throwing if not authenticated.
 * Useful for snapshot listeners that might fire during auth transitions.
 */
export function getUidSafe(): string | null {
  return auth.currentUser?.uid ?? null;
}