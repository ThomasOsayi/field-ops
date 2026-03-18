import { Job, NewJob } from '@/types/job';
import { createJob, updateJob, markJobComplete } from '@/lib/jobs';
import { syncJobToOutlook } from '@/lib/outlook-sync';
import { notifyJobCreated, notifyJobStatusChanged } from '@/lib/notifications';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createCompany, updateCompany } from '@/lib/contacts';
import { NewCompanyRecord } from '@/types/contact';

/**
 * Auto-create or update a company record from job data.
 * - If no company with this name exists → create one
 * - If it exists → update the contact info if changed
 */
async function ensureCompanyFromJob(job: NewJob | Job): Promise<void> {
  try {
    if (!job.company?.trim()) return;

    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, where('name', '==', job.company.trim()));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Create new company from job data
      const city = extractCity(job.address);
      const newCompany: NewCompanyRecord = {
        name: job.company.trim(),
        address: job.address?.trim() || '',
        city,
        contacts: job.contactName?.trim() ? [{
          name: job.contactName.trim(),
          role: '',
          phone: job.contactPhone?.trim() || '',
          email: '',
          isPrimary: true,
        }] : [],
        notes: '',
        jobCount: 1,
        lastJobDate: job.date || new Date().toISOString().split('T')[0],
      };
      await createCompany(newCompany);
    } else {
      // Company exists — check if we should add this contact
      const existingDoc = snap.docs[0];
      const existing = existingDoc.data();
      const contacts = existing.contacts || [];

      // Check if this contact name already exists
      const contactExists = contacts.some(
        (c: { name: string }) => c.name.toLowerCase().trim() === job.contactName?.toLowerCase().trim()
      );

      if (!contactExists && job.contactName?.trim()) {
        // Add new contact to existing company
        const updatedContacts = [
          ...contacts,
          {
            name: job.contactName.trim(),
            role: '',
            phone: job.contactPhone?.trim() || '',
            email: '',
            isPrimary: contacts.length === 0,
          },
        ];
        await updateCompany(existingDoc.id, { contacts: updatedContacts });
      }
    }
  } catch (err) {
    // Don't block job creation if contact sync fails
    console.error('Auto-contact creation failed:', err);
  }
}

/**
 * Extract city from address string.
 * Handles "123 Main St, Houston TX 77001" → "Houston, TX"
 * Handles "123 Main St, Houston, TX" → "Houston, TX"
 */
function extractCity(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Last part often has state + zip: "Houston TX 77001" or "TX 77001" or "TX"
    const lastPart = parts[parts.length - 1];
    const secondLast = parts.length >= 3 ? parts[parts.length - 2] : '';

    // Try to find state abbreviation
    const stateMatch = lastPart.match(/([A-Z]{2})/);
    if (stateMatch) {
      const state = stateMatch[1];
      // If second-to-last part looks like a city
      if (secondLast && !secondLast.match(/^\d/)) {
        return `${secondLast}, ${state}`;
      }
      // Extract city from last part before state
      const beforeState = lastPart.replace(/\s*[A-Z]{2}\s*\d*/, '').trim();
      if (beforeState) return `${beforeState}, ${state}`;
      return state;
    }
    // Fallback: return last two parts
    return parts.slice(-2).join(', ');
  }
  return address;
}

/**
 * Create a job, sync to Outlook, auto-create contact, and send a notification.
 */
export async function createJobWithSync(job: NewJob): Promise<string> {
  // 1. Create in Firestore
  const id = await createJob(job);

  // 2. Auto-create/update company in contacts (fire and forget)
  ensureCompanyFromJob(job).catch(() => {});

  // 3. Sync to Outlook
  const fullJob: Job = { ...job, id, createdAt: new Date().toISOString() };
  syncJobToOutlook(fullJob, 'create').catch(() => {});

  // 4. Create notification
  notifyJobCreated(job.jobNumber, job.company).catch(() => {});

  return id;
}

/**
 * Update a job, sync changes to Outlook, and notify on status change.
 */
export async function updateJobWithSync(
  id: string,
  data: Partial<Job>,
  fullJob: Job
): Promise<void> {
  const oldStatus = fullJob.status;

  // 1. Update in Firestore
  await updateJob(id, data);

  // 2. Sync to Outlook
  const updatedJob = { ...fullJob, ...data };
  syncJobToOutlook(updatedJob as Job, 'update').catch(() => {});

  // 3. Notify on status change
  if (data.status && data.status !== oldStatus) {
    notifyJobStatusChanged(fullJob.jobNumber, fullJob.company, data.status).catch(() => {});
  }
}

/**
 * Mark job complete, remove from Outlook, and notify.
 */
export async function markJobCompleteWithSync(job: Job): Promise<void> {
  // 1. Update in Firestore
  await markJobComplete(job.id);

  // 2. Delete from Outlook
  syncJobToOutlook(job, 'delete').catch(() => {});

  // 3. Notify
  notifyJobStatusChanged(job.jobNumber, job.company, 'completed').catch(() => {});
}