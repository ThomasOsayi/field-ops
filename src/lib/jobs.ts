import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Job, NewJob } from '@/types/job';

const COLLECTION = 'jobs';

// ── Fetch all jobs, newest first ──
export async function getJobs(): Promise<Job[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Job[];
}

// ── Create a new job ──
export async function createJob(job: NewJob): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...job,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Update an existing job ──
export async function updateJob(id: string, data: Partial<Job>): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...data });
}

// ── Mark a job as completed ──
export async function markJobComplete(id: string): Promise<void> {
  await updateJob(id, { status: 'completed' });
}