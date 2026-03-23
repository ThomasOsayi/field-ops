import { NextRequest, NextResponse } from 'next/server';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  jobToCalendarEvent,
  isOutlookConnected,
} from '@/lib/microsoft-graph';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Store Outlook event IDs mapped to job IDs under users/{uid}/outlook_event_mappings

async function getEventId(uid: string, jobId: string): Promise<string | null> {
  const ref = doc(db, `users/${uid}/outlook_event_mappings`, jobId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().eventId : null;
}

async function saveEventId(uid: string, jobId: string, eventId: string): Promise<void> {
  const ref = doc(db, `users/${uid}/outlook_event_mappings`, jobId);
  await setDoc(ref, { eventId, updatedAt: new Date().toISOString() });
}

async function removeEventId(uid: string, jobId: string): Promise<void> {
  const ref = doc(db, `users/${uid}/outlook_event_mappings`, jobId);
  await setDoc(ref, { eventId: null, removedAt: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  try {
    const { action, job, uid } = await request.json();

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check connection (tokens live under users/{uid}/settings/outlook_tokens)
    const { connected } = await isOutlookConnected(uid);
    if (!connected) {
      return NextResponse.json({ error: 'Outlook not connected' }, { status: 401 });
    }

    if (action === 'create' || action === 'update') {
      const calendarEvent = jobToCalendarEvent(job);
      const existingEventId = await getEventId(uid, job.id);

      if (existingEventId) {
        // Update existing event
        const success = await updateCalendarEvent(uid, existingEventId, calendarEvent);
        return NextResponse.json({ success, action: 'updated', eventId: existingEventId });
      } else {
        // Create new event
        const eventId = await createCalendarEvent(uid, calendarEvent);
        if (eventId) {
          await saveEventId(uid, job.id, eventId);
          return NextResponse.json({ success: true, action: 'created', eventId });
        }
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
      }
    }

    if (action === 'delete') {
      const eventId = await getEventId(uid, job.id);
      if (eventId) {
        const success = await deleteCalendarEvent(uid, eventId);
        if (success) await removeEventId(uid, job.id);
        return NextResponse.json({ success, action: 'deleted' });
      }
      return NextResponse.json({ success: true, action: 'no_event' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Outlook sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// GET — check connection status (?uid= required; matches client checkOutlookConnection)
export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    if (!uid) {
      return NextResponse.json({ connected: false, email: '' });
    }
    const status = await isOutlookConnected(uid);
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ connected: false, email: '' });
  }
}

// Temporary test — PUT /api/outlook/sync?uid=<firebaseUid> to test token against Graph /me
export async function PUT(request: NextRequest) {
  const { getValidAccessToken } = await import('@/lib/microsoft-graph');

  const uid = request.nextUrl.searchParams.get('uid');
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid query param' }, { status: 400 });
  }

  const tokenInfo = await getValidAccessToken(uid);
  if (!tokenInfo) {
    return NextResponse.json({ error: 'No token' });
  }

  // Test the token directly against a simple endpoint
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokenInfo.token}` },
  });
  
  const body = await res.text();
  return NextResponse.json({ 
    status: res.status, 
    body: body.substring(0, 500),
    tokenStart: tokenInfo.token.substring(0, 30),
  });
}