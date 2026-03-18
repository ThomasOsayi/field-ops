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

// Store Outlook event IDs mapped to job IDs
const MAPPING_COLLECTION = 'outlook_event_mappings';

async function getEventId(jobId: string): Promise<string | null> {
  const ref = doc(db, MAPPING_COLLECTION, jobId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().eventId : null;
}

async function saveEventId(jobId: string, eventId: string): Promise<void> {
  const ref = doc(db, MAPPING_COLLECTION, jobId);
  await setDoc(ref, { eventId, updatedAt: new Date().toISOString() });
}

async function removeEventId(jobId: string): Promise<void> {
  const ref = doc(db, MAPPING_COLLECTION, jobId);
  await setDoc(ref, { eventId: null, removedAt: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
  try {
    const { action, job } = await request.json();

    // Check connection
    const { connected } = await isOutlookConnected();
    if (!connected) {
      return NextResponse.json({ error: 'Outlook not connected' }, { status: 401 });
    }

    if (action === 'create' || action === 'update') {
      const calendarEvent = jobToCalendarEvent(job);
      const existingEventId = await getEventId(job.id);

      if (existingEventId) {
        // Update existing event
        const success = await updateCalendarEvent(existingEventId, calendarEvent);
        return NextResponse.json({ success, action: 'updated', eventId: existingEventId });
      } else {
        // Create new event
        const eventId = await createCalendarEvent(calendarEvent);
        if (eventId) {
          await saveEventId(job.id, eventId);
          return NextResponse.json({ success: true, action: 'created', eventId });
        }
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
      }
    }

    if (action === 'delete') {
      const eventId = await getEventId(job.id);
      if (eventId) {
        const success = await deleteCalendarEvent(eventId);
        if (success) await removeEventId(job.id);
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

// GET — check connection status
export async function GET() {
  try {
    const status = await isOutlookConnected();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ connected: false, email: '' });
  }
}