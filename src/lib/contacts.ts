import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    query,
    serverTimestamp,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { CompanyRecord, NewCompanyRecord } from '@/types/contact';
  
  const COLLECTION = 'companies';
  
  export async function getCompanies(): Promise<CompanyRecord[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompanyRecord));
  }
  
  export async function createCompany(company: NewCompanyRecord): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...company,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
  
  export async function updateCompany(id: string, data: Partial<CompanyRecord>): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await updateDoc(ref, data);
  }
  
  export async function deleteCompany(id: string): Promise<void> {
    const ref = doc(db, COLLECTION, id);
    await deleteDoc(ref);
  }