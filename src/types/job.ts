export type JobStatus = 'scheduled' | 'in-progress' | 'completed' | 'pending';

export interface Attachment {
  name: string;
  url: string;
  size: string;   // e.g. "1.2 MB"
  type: string;   // e.g. "PDF", "Archive"
}

export interface Job {
  id: string;                  // Firestore doc ID
  jobNumber: string;           // e.g. "JOB-2401"
  company: string;
  address: string;
  contactName: string;
  contactPhone: string;
  ktiTime: string;             // e.g. "4 hrs"
  onSiteTime: string;          // e.g. "10:30 AM"
  date: string;                // ISO string e.g. "2026-03-18"
  status: JobStatus;
  scope: string;
  notes: string;
  attachments: Attachment[];
  createdAt: string;           // ISO string
}

// Used when creating a new job (no id or createdAt yet)
export type NewJob = Omit<Job, 'id' | 'createdAt'>;