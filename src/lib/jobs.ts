import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUid, getUidSafe } from './auth-helpers';
import { Job, NewJob } from '@/types/job';

function jobsCol() {
  return collection(db, `users/${getUid()}/jobs`);
}

function jobDoc(id: string) {
  return doc(db, `users/${getUid()}/jobs`, id);
}

// ── Fetch all jobs, newest first (one-time) ──
export async function getJobs(): Promise<Job[]> {
  const q = query(jobsCol(), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Job[];
}

// ── Real-time listener ──
export function onJobsSnapshot(
  onData: (jobs: Job[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const uid = getUidSafe();
  if (!uid) { onData([]); return () => {}; }

  const q = query(collection(db, `users/${uid}/jobs`), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const jobs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Job[];
      onData(jobs);
    },
    (error) => {
      console.error('Jobs snapshot error:', error);
      onError?.(error);
    }
  );
}

// ── Create a new job ──
export async function createJob(job: NewJob): Promise<string> {
  const ref = await addDoc(jobsCol(), { ...job, createdAt: serverTimestamp() });
  return ref.id;
}

// ── Update an existing job ──
export async function updateJob(id: string, data: Partial<Job>): Promise<void> {
  await updateDoc(jobDoc(id), { ...data });
}

// ── Mark a job as completed ──
export async function markJobComplete(id: string): Promise<void> {
  await updateJob(id, { status: 'completed' });
}

// ── Delete a job ──
export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(jobDoc(id));
}