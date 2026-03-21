import { NextRequest, NextResponse } from 'next/server';
import {
  isOutlookConnected,
  getValidAccessToken,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  jobToCalendarEvent,
} from '@/lib/microsoft-graph';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

// GET — check connection status
export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ connected: false, email: '' });

  const status = await isOutlookConnected(uid);
  return NextResponse.json(status);
}

// POST — sync a job to Outlook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, job, uid } = body;

    if (!uid) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    if (!job || !action) {
      return NextResponse.json({ success: false, error: 'Missing job or action' }, { status: 400 });
    }

    const tokenInfo = await getValidAccessToken(uid);
    if (!tokenInfo) {
      return NextResponse.json({ success: false, error: 'Outlook not connected' }, { status: 401 });
    }

    // Event mapping stored per-user
    const mappingRef = doc(db, `users/${uid}/outlook_event_mappings`, job.id);

    if (action === 'create') {
      const event = jobToCalendarEvent(job);
      const eventId = await createCalendarEvent(uid, event);
      if (!eventId) {
        return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 });
      }
      // Store mapping
      await setDoc(mappingRef, { eventId, jobNumber: job.jobNumber, createdAt: new Date().toISOString() });
      return NextResponse.json({ success: true, action: 'created', eventId });
    }

    if (action === 'update') {
      const mappingSnap = await getDoc(mappingRef);
      if (!mappingSnap.exists()) {
        // No existing event — create instead
        const event = jobToCalendarEvent(job);
        const eventId = await createCalendarEvent(uid, event);
        if (eventId) {
          await setDoc(mappingRef, { eventId, jobNumber: job.jobNumber, createdAt: new Date().toISOString() });
        }
        return NextResponse.json({ success: true, action: 'created', eventId });
      }

      const { eventId } = mappingSnap.data();
      const event = jobToCalendarEvent(job);
      const updated = await updateCalendarEvent(uid, eventId, event);
      return NextResponse.json({ success: updated, action: 'updated' });
    }

    if (action === 'delete') {
      const mappingSnap = await getDoc(mappingRef);
      if (!mappingSnap.exists()) {
        return NextResponse.json({ success: true, action: 'no_event' });
      }
      const { eventId } = mappingSnap.data();
      await deleteCalendarEvent(uid, eventId);
      await deleteDoc(mappingRef);
      return NextResponse.json({ success: true, action: 'deleted' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}