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
  import { CompanyRecord, NewCompanyRecord } from '@/types/contact';
  
  const COLLECTION = 'companies';
  
  // ── Fetch all companies, newest first (one-time) ──
  export async function getCompanies(): Promise<CompanyRecord[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as CompanyRecord[];
  }
  
  // ── Real-time listener ──
  export function onCompaniesSnapshot(
    onData: (companies: CompanyRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const companies = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CompanyRecord[];
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
    const ref = await addDoc(collection(db, COLLECTION), {
      ...company,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }
  
  // ── Update an existing company ──
  export async function updateCompany(id: string, data: Partial<CompanyRecord>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, { ...data });
  }
  
  // ── Delete a company ──
  export async function deleteCompany(id: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
  }