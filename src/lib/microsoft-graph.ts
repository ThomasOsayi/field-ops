import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID!;
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback/outlook`;

const TOKEN_DOC = 'outlook_tokens';
const SETTINGS_COLLECTION = 'settings';

// ── Types ──
interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in ms
  user_email: string;
}

interface CalendarEvent {
  subject: string;
  body: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
}

// ── OAuth URLs ──
export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: 'offline_access Calendars.ReadWrite User.Read',
    state: 'fieldops-outlook-sync',
  });

  return `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

// ── Exchange auth code for tokens ──
export async function exchangeCodeForTokens(code: string): Promise<TokenData> {
  const response = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
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
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  // Get user email
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

  // Store in Firestore
  await saveTokens(tokenData);

  return tokenData;
}

// ── Refresh access token ──
async function refreshAccessToken(refreshToken: string): Promise<TokenData> {
  const response = await fetch(
    `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'offline_access Calendars.ReadWrite User.Read',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  const tokenData: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + data.expires_in * 1000,
    user_email: '', // Will be preserved from stored data
  };

  return tokenData;
}

// ── Token storage (Firestore) ──
async function saveTokens(tokens: TokenData): Promise<void> {
  const ref = doc(db, SETTINGS_COLLECTION, TOKEN_DOC);
  await setDoc(ref, tokens);
}

async function getStoredTokens(): Promise<TokenData | null> {
  const ref = doc(db, SETTINGS_COLLECTION, TOKEN_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as TokenData;
}

// ── Get a valid access token (auto-refresh if expired) ──
export async function getValidAccessToken(): Promise<{ token: string; email: string } | null> {
  const stored = await getStoredTokens();
  if (!stored) return null;

  // If token expires in less than 5 minutes, refresh it
  if (Date.now() > stored.expires_at - 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(stored.refresh_token);
      refreshed.user_email = stored.user_email;
      await saveTokens(refreshed);
      return { token: refreshed.access_token, email: refreshed.user_email };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return { token: stored.access_token, email: stored.user_email };
}

// ── Check if Outlook is connected ──
export async function isOutlookConnected(): Promise<{ connected: boolean; email: string }> {
  const tokenInfo = await getValidAccessToken();
  return {
    connected: !!tokenInfo,
    email: tokenInfo?.email || '',
  };
}

// ── Disconnect (remove tokens) ──
export async function disconnectOutlook(): Promise<void> {
  const ref = doc(db, SETTINGS_COLLECTION, TOKEN_DOC);
  await setDoc(ref, { disconnected: true });
}

// ═══ CALENDAR OPERATIONS ═══

// ── Create a calendar event ──
export async function createCalendarEvent(event: CalendarEvent): Promise<string | null> {
  const tokenInfo = await getValidAccessToken();
  if (!tokenInfo) return null;

  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenInfo.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create calendar event:', error);
    return null;
  }

  const data = await response.json();
  return data.id; // Outlook event ID
}

// ── Update a calendar event ──
export async function updateCalendarEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
  const tokenInfo = await getValidAccessToken();
  if (!tokenInfo) return false;

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenInfo.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update calendar event:', error);
    return false;
  }

  return true;
}

// ── Delete a calendar event ──
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const tokenInfo = await getValidAccessToken();
  if (!tokenInfo) return false;

  const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenInfo.token}` },
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
  jobNumber: string;
  company: string;
  address: string;
  onSiteTime: string;
  ktiTime: string;
  date: string;
  scope: string;
  notes: string;
}): CalendarEvent {
  // Parse on-site time: "10:30 AM" → { hours: 10, minutes: 30 }
  const timeMatch = job.onSiteTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hours = timeMatch ? parseInt(timeMatch[1]) : 9;
  const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
  const ampm = timeMatch ? timeMatch[3].toUpperCase() : 'AM';
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  // Parse KTI: "4 hrs" → 4
  const ktiMatch = job.ktiTime.match(/(\d+)/);
  const durationHours = ktiMatch ? parseInt(ktiMatch[1]) : 2;

  // Build start/end datetimes
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
    body: {
      contentType: 'Text',
      content: bodyParts.join('\n'),
    },
    start: { dateTime: formatDT(startDate), timeZone: 'America/Chicago' },
    end: { dateTime: formatDT(endDate), timeZone: 'America/Chicago' },
    location: { displayName: job.address },
  };
}