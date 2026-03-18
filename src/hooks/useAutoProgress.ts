import { useEffect, useRef } from 'react';
import { Job } from '@/types/job';
import { updateJobWithSync } from '@/lib/job-actions';

/**
 * Parses a time string into today's Date object.
 * Handles "10:30 AM", "2:00 PM", and "14:00" formats.
 */
function parseTimeToDate(timeStr: string, dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);

  // Try AM/PM format first: "10:30 AM"
  const ampm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = parseInt(ampm[2]);
    const ap = ampm[3].toUpperCase();
    if (ap === 'PM' && h !== 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return new Date(year, month - 1, day, h, m);
  }

  // Try 24hr format: "14:00"
  const mil = timeStr.match(/(\d+):(\d+)/);
  if (mil) {
    return new Date(year, month - 1, day, parseInt(mil[1]), parseInt(mil[2]));
  }

  // Fallback: return a date far in the future so it never triggers
  return new Date(year, month - 1, day, 23, 59);
}

/**
 * Hook that automatically transitions 'scheduled' jobs to 'in-progress'
 * when the current time passes their on-site time.
 * 
 * Runs on mount and every 5 minutes.
 */
export function useAutoProgress(jobs: Job[]) {
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkAndUpdate = async () => {
      const now = new Date();

      for (const job of jobs) {
        // Only transition scheduled → in-progress
        if (job.status !== 'scheduled') continue;
        // Don't process the same job twice in this session
        if (processedRef.current.has(job.id)) continue;

        const onSiteDate = parseTimeToDate(job.onSiteTime, job.date);

        // If the on-site time has passed, transition to in-progress
        if (now >= onSiteDate) {
          try {
            processedRef.current.add(job.id);
            await updateJobWithSync(
              job.id,
              { status: 'in-progress' },
              { ...job, status: 'in-progress' }
            );
            console.log(`Auto-progressed ${job.jobNumber} to in-progress`);
          } catch (err) {
            console.error(`Failed to auto-progress ${job.jobNumber}:`, err);
            // Remove from processed so it retries next cycle
            processedRef.current.delete(job.id);
          }
        }
      }
    };

    // Run immediately
    checkAndUpdate();

    // Then every 5 minutes
    const interval = setInterval(checkAndUpdate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [jobs]);
}