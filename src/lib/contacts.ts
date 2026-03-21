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
import { CompanyRecord, NewCompanyRecord } from '@/types/contact';

function companiesCol() {
  return collection(db, `users/${getUid()}/companies`);
}

function companyDoc(id: string) {
  return doc(db, `users/${getUid()}/companies`, id);
}

// ── Fetch all companies, newest first (one-time) ──
export async function getCompanies(): Promise<CompanyRecord[]> {
  const q = query(companiesCol(), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as CompanyRecord[];
}

// ── Real-time listener ──
export function onCompaniesSnapshot(
  onData: (companies: CompanyRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const uid = getUidSafe();
  if (!uid) { onData([]); return () => {}; }

  const q = query(collection(db, `users/${uid}/companies`), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const companies = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as CompanyRecord[];
      onData(companies);
    },
    (error) => {
      console.error('Companies snapshot error:', error);
      onError?.(error);
    }
  );
}

// ── Create a new company ──
export async function createCompany(company: NewCompanyRecord): Promise<string> {
  const ref = await addDoc(companiesCol(), { ...company, createdAt: serverTimestamp() });
  return ref.id;
}

// ── Update an existing company ──
export async function updateCompany(id: string, data: Partial<CompanyRecord>): Promise<void> {
  await updateDoc(companyDoc(id), { ...data });
}

// ── Delete a company ──
export async function deleteCompany(id: string): Promise<void> {
  await deleteDoc(companyDoc(id));
}