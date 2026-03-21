import { NextRequest, NextResponse } from 'next/server';
import {
  createCalendarEvent,
  jobToCalendarEvent,
  isOutlookConnected,
} from '@/lib/microsoft-graph';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import type { Job } from '@/types/job';

async function getEventId(uid: string, jobId: string): Promise<string | null> {
  const ref = doc(db, `users/${uid}/outlook_event_mappings`, jobId);
  const snap = await getDoc(ref);
  const eventId = snap.exists() ? snap.data().eventId : null;
  return eventId && typeof eventId === 'string' ? eventId : null;
}

async function saveEventId(uid: string, jobId: string, eventId: string): Promise<void> {
  const ref = doc(db, `users/${uid}/outlook_event_mappings`, jobId);
  await setDoc(ref, { eventId, updatedAt: new Date().toISOString() });
}

function snapToJob(snap: QueryDocumentSnapshot<DocumentData>): Job {
  const data = snap.data();
  const ts = data.createdAt as { toDate?: () => Date } | string | undefined;
  const createdAt =
    ts && typeof ts === 'object' && typeof ts.toDate === 'function'
      ? ts.toDate().toISOString()
      : typeof ts === 'string'
        ? ts
        : '';
  return {
    id: snap.id,
    jobNumber: String(data.jobNumber ?? ''),
    company: String(data.company ?? ''),
    address: String(data.address ?? ''),
    contactName: String(data.contactName ?? ''),
    contactPhone: String(data.contactPhone ?? ''),
    ktiTime: String(data.ktiTime ?? ''),
    onSiteTime: String(data.onSiteTime ?? ''),
    date: String(data.date ?? ''),
    status: data.status as Job['status'],
    scope: String(data.scope ?? ''),
    notes: String(data.notes ?? ''),
    attachments: Array.isArray(data.attachments) ? (data.attachments as Job['attachments']) : [],
    createdAt,
  };
}

/**
 * POST body: { uid: string }
 * Creates Outlook events for all non-completed jobs under users/{uid}/jobs that lack a mapping.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const uid = body?.uid as string | undefined;
    if (!uid || typeof uid !== 'string') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { connected } = await isOutlookConnected(uid);
    if (!connected) {
      return NextResponse.json({ error: 'Outlook not connected' }, { status: 400 });
    }

    const jobsSnap = await getDocs(collection(db, `users/${uid}/jobs`));
    const jobs = jobsSnap.docs.map((d) => snapToJob(d));
    const activeJobs = jobs.filter((j) => j.status !== 'completed');

    let alreadySynced = 0;
    let newlySynced = 0;
    let failed = 0;
    const results: { jobId: string; status: string; error?: string }[] = [];

    for (const job of activeJobs) {
      try {
        const existingId = await getEventId(uid, job.id);
        if (existingId) {
          alreadySynced += 1;
          results.push({ jobId: job.id, status: 'already_synced' });
          continue;
        }

        const calendarEvent = jobToCalendarEvent(job);
        const eventId = await createCalendarEvent(uid, calendarEvent);
        if (eventId) {
          await saveEventId(uid, job.id, eventId);
          newlySynced += 1;
          results.push({ jobId: job.id, status: 'synced' });
        } else {
          failed += 1;
          results.push({ jobId: job.id, status: 'failed', error: 'Graph create returned no id' });
        }
      } catch (e) {
        failed += 1;
        results.push({
          jobId: job.id,
          status: 'failed',
          error: e instanceof Error ? e.message : 'unknown',
        });
      }
    }

    return NextResponse.json({
      total: activeJobs.length,
      alreadySynced,
      newlySynced,
      failed,
      results,
    });
  } catch (error) {
    console.error('Outlook sync-all error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
