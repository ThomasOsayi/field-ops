import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot,
    Unsubscribe,
    Timestamp,
  } from 'firebase/firestore';
  import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    UploadTask,
  } from 'firebase/storage';
  import { db, storage } from './firebase';
  
  const COLLECTION = 'documents';
  
  // ── Types ──
  export interface DocRecord {
    id: string;
    name: string;
    size: string;          // e.g. "1.2 MB"
    sizeBytes: number;     // raw bytes for sorting/totals
    type: string;          // "pdf" | "image" | "archive" | "checklist" | "doc"
    mimeType: string;      // actual MIME type
    jobNumber: string;     // linked job, empty if standalone
    company: string;       // linked company name
    storageUrl: string;    // Firebase Storage download URL
    storagePath: string;   // Firebase Storage path for deletion
    uploadedBy: string;
    createdAt: string;
  }
  
  export type NewDocRecord = Omit<DocRecord, 'id' | 'createdAt'>;
  
  // ── Fetch all docs (one-time) ──
  export async function getDocuments(): Promise<DocRecord[]> {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt ?? new Date().toISOString(),
      };
    }) as DocRecord[];
  }
  
  // ── Real-time listener ──
  export function onDocumentsSnapshot(
    onData: (docs: DocRecord[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : data.createdAt ?? new Date().toISOString(),
          };
        }) as DocRecord[];
        onData(docs);
      },
      (error) => {
        console.error('Documents snapshot error:', error);
        onError?.(error);
      }
    );
  }
  
  // ── Upload file to Storage + save metadata to Firestore ──
  export function uploadDocument(
    file: File,
    metadata: {
      jobNumber: string;
      company: string;
      uploadedBy: string;
    },
    onProgress?: (percent: number) => void,
    onComplete?: (doc: DocRecord) => void,
    onError?: (error: Error) => void
  ): UploadTask {
    const storagePath = `documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
  
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(percent);
      },
      (error) => {
        console.error('Upload error:', error);
        onError?.(error);
      },
      async () => {
        try {
          const storageUrl = await getDownloadURL(uploadTask.snapshot.ref);
  
          const docData: NewDocRecord = {
            name: file.name,
            size: formatFileSize(file.size),
            sizeBytes: file.size,
            type: inferFileType(file.name, file.type),
            mimeType: file.type,
            jobNumber: metadata.jobNumber,
            company: metadata.company,
            storageUrl,
            storagePath,
            uploadedBy: metadata.uploadedBy,
          };
  
          const docRef = await addDoc(collection(db, COLLECTION), {
            ...docData,
            createdAt: serverTimestamp(),
          });
  
          onComplete?.({ id: docRef.id, ...docData, createdAt: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to save document metadata:', error);
          onError?.(error as Error);
        }
      }
    );
  
    return uploadTask;
  }
  
  // ── Delete document (Storage file + Firestore record) ──
  export async function deleteDocument(docRecord: DocRecord): Promise<void> {
    // Delete from Storage
    if (docRecord.storagePath) {
      try {
        const storageRef = ref(storage, docRecord.storagePath);
        await deleteObject(storageRef);
      } catch (error) {
        console.warn('Storage file not found or already deleted:', error);
      }
    }
    // Delete Firestore record
    const docRef = doc(db, COLLECTION, docRecord.id);
    await deleteDoc(docRef);
  }
  
  // ── Get download URL for a document ──
  export async function getDocumentDownloadUrl(storagePath: string): Promise<string> {
    const storageRef = ref(storage, storagePath);
    return getDownloadURL(storageRef);
  }
  
  // ── Helpers ──
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  function inferFileType(fileName: string, mimeType: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
  
    // Check filename patterns for checklists
    if (fileName.toLowerCase().includes('checklist')) return 'checklist';
  
    return 'doc';
  }