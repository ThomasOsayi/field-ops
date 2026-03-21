import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { getUid, getUidSafe } from './auth-helpers';

// ── Types ──
export type NotifType = 'status' | 'new-job' | 'reminder' | 'sync' | 'upload';
export type NotifCategory = 'job' | 'calendar' | 'doc' | 'outlook';

export interface NotifRecord {
  id: string;
  type: NotifType;
  category: NotifCategory;
  unread: boolean;
  titleBold: string;
  title: string;
  desc: string;
  createdAt: string;
}

export type NewNotifRecord = Omit<NotifRecord, 'id' | 'createdAt'>;

function notifsCol() {
  return collection(db, `users/${getUid()}/notifications`);
}

function notifDoc(id: string) {
  return doc(db, `users/${getUid()}/notifications`, id);
}

// ── Fetch all notifications (one-time) ──
export async function getNotifications(): Promise<NotifRecord[]> {
  const q = query(notifsCol(), orderBy('createdAt', 'desc'));
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
  }) as NotifRecord[];
}

// ── Real-time listener ──
export function onNotificationsSnapshot(
  onData: (notifs: NotifRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const uid = getUidSafe();
  if (!uid) { onData([]); return () => {}; }

  const q = query(collection(db, `users/${uid}/notifications`), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const notifs = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt ?? new Date().toISOString(),
        };
      }) as NotifRecord[];
      onData(notifs);
    },
    (error) => {
      console.error('Notifications snapshot error:', error);
      onError?.(error);
    }
  );
}

// ── Mark a single notification as read ──
export async function markNotifRead(id: string): Promise<void> {
  await updateDoc(notifDoc(id), { unread: false });
}

// ── Toggle read/unread ──
export async function toggleNotifRead(id: string, currentUnread: boolean): Promise<void> {
  await updateDoc(notifDoc(id), { unread: !currentUnread });
}

// ── Mark all notifications as read ──
export async function markAllNotifsRead(): Promise<void> {
  const uid = getUidSafe();
  if (!uid) return;
  const q = query(collection(db, `users/${uid}/notifications`), where('unread', '==', true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => { batch.update(d.ref, { unread: false }); });
  await batch.commit();
}

// ── Create a notification ──
export async function createNotification(notif: NewNotifRecord): Promise<string> {
  const ref = await addDoc(notifsCol(), { ...notif, createdAt: serverTimestamp() });
  return ref.id;
}

// ═══ Convenience creators ═══

export async function notifyJobCreated(jobNumber: string, company: string): Promise<void> {
  await createNotification({ type: 'new-job', category: 'job', unread: true, titleBold: jobNumber, title: 'New job  created', desc: `${company} — Scheduled` });
}

export async function notifyJobStatusChanged(jobNumber: string, company: string, newStatus: string): Promise<void> {
  const statusLabel = newStatus === 'in-progress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
  await createNotification({ type: 'status', category: 'job', unread: true, titleBold: jobNumber, title: ` status changed to ${statusLabel}`, desc: company });
}

export async function notifyJobReminder(jobNumber: string, company: string, onSiteTime: string): Promise<void> {
  await createNotification({ type: 'reminder', category: 'calendar', unread: true, titleBold: jobNumber, title: ' starts in 1 hour', desc: `${company} — On site at ${onSiteTime}` });
}

export async function notifyOutlookSync(eventCount: number): Promise<void> {
  await createNotification({ type: 'sync', category: 'outlook', unread: true, titleBold: '', title: 'Outlook Calendar synced successfully', desc: `${eventCount} events updated` });
}

export async function notifyDocumentUploaded(fileName: string, jobNumber: string, uploadedBy: string): Promise<void> {
  await createNotification({ type: 'upload', category: 'doc', unread: true, titleBold: jobNumber || fileName, title: jobNumber ? `New document uploaded to ` : 'New document uploaded', desc: `${fileName} — uploaded by ${uploadedBy}` });
}