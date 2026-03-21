import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;

// Dynamic redirect URI — uses NEXTAUTH_URL which is:
//   http://localhost:3000 in dev (.env.local)
//   https://fieldopapp.com in production (Vercel env vars)
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback/outlook`;

// ── Types ──
interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_email: string;
}

interface CalendarEvent {
  subject: string;
  body: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
}

// ═══ OAuth URLs ═══

/**
 * Generate the Microsoft OAuth URL.
 * Encodes the Firebase uid in the state parameter so the callback
 * knows which user to store tokens for.
 */
export function getAuthUrl(firebaseUid: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: 'offline_access Calendars.ReadWrite User.Read',
    state: `fieldops-${firebaseUid}`,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

// ═══ Token Exchange ═══

export async function exchangeCodeForTokens(code: string, firebaseUid: string): Promise<TokenData> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      scope: 'offline_access Calendars.ReadWrite User.Read',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  // Get user email from Microsoft
  const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const userData = await userResponse.json();

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    user_email: userData.mail || userData.userPrincipalName || '',
  };

  await saveTokens(firebaseUid, tokenData);
  return tokenData;
}

// ═══ Token Refresh ═══

async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID,
      client_secret: MICROSOFT_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'offline_access Calendars.ReadWrite User.Read',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
    user_email: '',
  };
}

// ═══ Per-User Token Storage ═══

async function saveTokens(uid: string, tokens: TokenData): Promise<void> {
  const ref = doc(db, `users/${uid}/settings`, 'outlook_tokens');
  await setDoc(ref, tokens);
}

async function getStoredTokens(uid: string): Promise<TokenData | null> {
  const ref = doc(db, `users/${uid}/settings`, 'outlook_tokens');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as TokenData;
}

// ── Get a valid access token (auto-refresh if expired) ──
export async function getValidAccessToken(uid: string): Promise<{ token: string; email: string } | null> {
  const stored = await getStoredTokens(uid);
  if (!stored || !stored.access_token) return null;

  if (Date.now() > stored.expires_at - 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(stored.refresh_token);
      refreshed.user_email = stored.user_email;
      await saveTokens(uid, refreshed);
      return { token: refreshed.access_token, email: refreshed.user_email };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return { token: stored.access_token, email: stored.user_email };
}

// ── Check if Outlook is connected for a user ──
export async function isOutlookConnected(uid: string): Promise<{ connected: boolean; email: string }> {
  const tokenInfo = await getValidAccessToken(uid);
  return { connected: !!tokenInfo, email: tokenInfo?.email || '' };
}

// ── Disconnect (remove tokens) ──
export async function disconnectOutlook(uid: string): Promise<void> {
  const ref = doc(db, `users/${uid}/settings`, 'outlook_tokens');
  await setDoc(ref, { disconnected: true });
}

// ═══ CALENDAR OPERATIONS ═══

export async function createCalendarEvent(uid: string, event: CalendarEvent): Promise<string | null> {
  const tokenInfo = await getValidAccessToken(uid);
  if (!tokenInfo) { console.error('No valid access token'); return null; }

  const token = tokenInfo.token?.trim();
  if (!token) { console.error('No valid access token string'); return null; }

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(event),
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Graph API error:', response.status, error);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
}

export async function updateCalendarEvent(uid: string, eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
  const tokenInfo = await getValidAccessToken(uid);
  if (!tokenInfo) return false;

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenInfo.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update calendar event:', error);
    return false;
  }
  return true;
}

export async function deleteCalendarEvent(uid: string, eventId: string): Promise<boolean> {
  const tokenInfo = await getValidAccessToken(uid);
  if (!tokenInfo) return false;

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenInfo.token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to delete calendar event:', error);
    return false;
  }
  return true;
}

// ═══ JOB → CALENDAR EVENT CONVERSION ═══

export function jobToCalendarEvent(job: {
  jobNumber: string; company: string; address: string;
  onSiteTime: string; ktiTime: string; date: string;
  scope: string; notes: string;
}): CalendarEvent {
  let hours = 9, minutes = 0;
  const ampmMatch = job.onSiteTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  const militaryMatch = job.onSiteTime.match(/^(\d{1,2}):(\d{2})$/);

  if (ampmMatch) {
    hours = parseInt(ampmMatch[1]); minutes = parseInt(ampmMatch[2]);
    const ampm = ampmMatch[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  } else if (militaryMatch) {
    hours = parseInt(militaryMatch[1]); minutes = parseInt(militaryMatch[2]);
  }

  const ktiMatch = job.ktiTime.match(/(\d+)/);
  const durationHours = ktiMatch ? parseInt(ktiMatch[1]) : 2;

  const [year, month, day] = job.date.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, hours, minutes);
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

  const formatDT = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

  const bodyParts = [`Scope: ${job.scope}`];
  if (job.notes) bodyParts.push(`Notes: ${job.notes}`);
  bodyParts.push(`\nJob: ${job.jobNumber} | KTI: ${job.ktiTime}`);

  return {
    subject: `${job.jobNumber} — ${job.company}`,
    body: { contentType: 'Text', content: bodyParts.join('\n') },
    start: { dateTime: formatDT(startDate), timeZone: 'America/Chicago' },
    end: { dateTime: formatDT(endDate), timeZone: 'America/Chicago' },
    location: { displayName: job.address },
  };
}