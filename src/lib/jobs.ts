import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Job } from "@/types/job";

const JOBS_COLLECTION = "jobs";

function firestoreDocToJob(id: string, data: DocumentData): Job {
  return {
    id,
    title: data.title ?? "",
    description: data.description,
    status: data.status ?? "pending",
    assignee: data.assignee,
    location: data.location,
    dueDate: data.dueDate,
    createdAt: data.createdAt ?? "",
    updatedAt: data.updatedAt ?? "",
  };
}

export async function getJobs(constraints: QueryConstraint[] = []): Promise<Job[]> {
  const col = collection(db, JOBS_COLLECTION);
  const q = constraints.length
    ? query(col, ...constraints, orderBy("updatedAt", "desc"))
    : query(col, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => firestoreDocToJob(d.id, d.data()));
}

export async function getJobById(id: string): Promise<Job | null> {
  const ref = doc(db, JOBS_COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return firestoreDocToJob(snapshot.id, snapshot.data());
}

export async function createJob(
  data: Omit<Job, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const col = collection(db, JOBS_COLLECTION);
  const now = new Date().toISOString();
  const docRef = await addDoc(col, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateJob(
  id: string,
  data: Partial<Omit<Job, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(db, JOBS_COLLECTION, id);
  await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteJob(id: string): Promise<void> {
  const ref = doc(db, JOBS_COLLECTION, id);
  await deleteDoc(ref);
}
