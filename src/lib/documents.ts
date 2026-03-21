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
import { getUid, getUidSafe } from './auth-helpers';

// ── Types ──
export interface DocRecord {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  type: string;
  mimeType: string;
  jobNumber: string;
  company: string;
  storageUrl: string;
  storagePath: string;
  uploadedBy: string;
  createdAt: string;
}

export type NewDocRecord = Omit<DocRecord, 'id' | 'createdAt'>;

function docsCol() {
  return collection(db, `users/${getUid()}/documents`);
}

function docRef(id: string) {
  return doc(db, `users/${getUid()}/documents`, id);
}

// ── Fetch all docs (one-time) ──
export async function getDocuments(): Promise<DocRecord[]> {
  const q = query(docsCol(), orderBy('createdAt', 'desc'));
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
  const uid = getUidSafe();
  if (!uid) { onData([]); return () => {}; }

  const q = query(collection(db, `users/${uid}/documents`), orderBy('createdAt', 'desc'));
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
  metadata: { jobNumber: string; company: string; uploadedBy: string },
  onProgress?: (percent: number) => void,
  onComplete?: (doc: DocRecord) => void,
  onError?: (error: Error) => void
): UploadTask {
  const uid = getUid();
  const storagePath = `users/${uid}/documents/${Date.now()}_${file.name}`;
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
        const colRef = collection(db, `users/${uid}/documents`);
        const newDocRef = await addDoc(colRef, { ...docData, createdAt: serverTimestamp() });
        onComplete?.({ id: newDocRef.id, ...docData, createdAt: new Date().toISOString() });
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
  if (docRecord.storagePath) {
    try {
      const storageRef = ref(storage, docRecord.storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('Storage file not found or already deleted:', error);
    }
  }
  await deleteDoc(docRef(docRecord.id));
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
  if (fileName.toLowerCase().includes('checklist')) return 'checklist';
  return 'doc';
}