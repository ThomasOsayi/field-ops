import { Job, NewJob } from '@/types/job';
import { createJob, updateJob, markJobComplete } from '@/lib/jobs';
import { syncJobToOutlook } from '@/lib/outlook-sync';
import { notifyJobCreated, notifyJobStatusChanged } from '@/lib/notifications';

/**
 * Create a job, sync to Outlook, and send a notification.
 * Use this instead of calling createJob directly.
 */
export async function createJobWithSync(job: NewJob): Promise<string> {
  // 1. Create in Firestore
  const id = await createJob(job);

  // 2. Sync to Outlook (fire and forget — don't block on failure)
  const fullJob: Job = { ...job, id, createdAt: new Date().toISOString() };
  syncJobToOutlook(fullJob, 'create').catch(() => {});

  // 3. Create notification
  notifyJobCreated(job.jobNumber, job.company).catch(() => {});

  return id;
}

/**
 * Update a job, sync changes to Outlook, and notify on status change.
 */
export async function updateJobWithSync(
  id: string,
  data: Partial<Job>,
  fullJob: Job
): Promise<void> {
  const oldStatus = fullJob.status;

  // 1. Update in Firestore
  await updateJob(id, data);

  // 2. Sync to Outlook
  const updatedJob = { ...fullJob, ...data };
  syncJobToOutlook(updatedJob as Job, 'update').catch(() => {});

  // 3. Notify on status change
  if (data.status && data.status !== oldStatus) {
    notifyJobStatusChanged(fullJob.jobNumber, fullJob.company, data.status).catch(() => {});
  }
}

/**
 * Mark job complete, remove from Outlook, and notify.
 */
export async function markJobCompleteWithSync(job: Job): Promise<void> {
  // 1. Update in Firestore
  await markJobComplete(job.id);

  // 2. Delete from Outlook (or update — depending on settings)
  syncJobToOutlook(job, 'delete').catch(() => {});

  // 3. Notify
  notifyJobStatusChanged(job.jobNumber, job.company, 'completed').catch(() => {});
}