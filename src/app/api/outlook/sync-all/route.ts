import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getValidAccessToken,
  isOutlookConnected,
  jobToCalendarEvent,
  createCalendarEvent,
} from '@/lib/microsoft-graph';

export async function POST(request: NextRequest) {
  try {
    // Check connection
    const connected = await isOutlookConnected();
    if (!connected) {
      return NextResponse.json({ error: 'Outlook not connected' }, { status: 400 });
    }

    // Get access token
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }

    // Get all active jobs (not completed)
    const jobsSnap = await getDocs(collection(db, 'jobs'));
    const allJobs = jobsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((j: any) => j.status !== 'completed');

    // Get all existing mappings
    const mappingsSnap = await getDocs(collection(db, 'outlook_event_mappings'));
    const mappedJobIds = new Set(mappingsSnap.docs.map(d => d.data().jobId));

    // Find jobs without Outlook events
    const unmappedJobs = allJobs.filter((j: any) => !mappedJobIds.has(j.id));

    let synced = 0;
    let failed = 0;
    const results: { jobNumber: string; status: 'synced' | 'failed'; error?: string }[] = [];

    for (const job of unmappedJobs) {
      try {
        const calendarEvent = jobToCalendarEvent(job as any);
        const createdEvent = await createCalendarEvent(calendarEvent);

        // Save mapping
        if (createdEvent) {
          await setDoc(doc(db, 'outlook_event_mappings', job.id), {
            jobId: job.id,
            eventId: createdEvent,
            jobNumber: (job as any).jobNumber || '',
            createdAt: new Date().toISOString(),
          });
        }

        synced++;
        results.push({ jobNumber: (job as any).jobNumber || job.id, status: 'synced' });
      } catch (err: any) {
        failed++;
        results.push({ jobNumber: (job as any).jobNumber || job.id, status: 'failed', error: err.message });
        console.error(`Failed to sync ${(job as any).jobNumber}:`, err.message);
      }
    }

    const alreadySynced = allJobs.length - unmappedJobs.length;

    return NextResponse.json({
      total: allJobs.length,
      alreadySynced,
      newlySynced: synced,
      failed,
      results,
    });
  } catch (error: any) {
    console.error('Bulk sync error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}