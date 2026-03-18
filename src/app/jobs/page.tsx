'use client';

import { useEffect, useState, useCallback } from 'react';
import { Job } from '@/types/job';
import { getJobs } from '@/lib/jobs';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import StatsRow from '@/components/StatsRow';
import JobsTable from '@/components/JobsTable';
import NewJobPanel from '@/components/NewJobPanel';
import DetailPanel from '@/components/DetailPanel';

const SEED_JOBS: Job[] = [
  {
    id: 'seed-1',
    jobNumber: 'JOB-2401',
    company: 'Meridian Controls',
    address: '4521 Industrial Blvd, Houston TX',
    contactName: 'Mike Torres',
    contactPhone: '(832) 555-0147',
    ktiTime: '4 hrs',
    onSiteTime: '10:30 AM',
    date: '2026-03-18',
    status: 'scheduled',
    scope: 'HVAC panel replacement, BMS integration',
    notes: 'Gate code: 4829#. Ask for building manager if Mike is unavailable. Park in loading bay B.',
    attachments: [
      { name: 'MOP-2401.pdf', url: '', size: '1.2 MB', type: 'PDF' },
      { name: 'checklist-hvac.pdf', url: '', size: '340 KB', type: 'PDF' },
      { name: 'site-photos.zip', url: '', size: '8.4 MB', type: 'Archive' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-2',
    jobNumber: 'JOB-2400',
    company: 'Atlas Data Centers',
    address: '880 Server Way, Dallas TX',
    contactName: 'Sarah Kim',
    contactPhone: '(469) 555-0283',
    ktiTime: '2 hrs',
    onSiteTime: '2:00 PM',
    date: '2026-03-18',
    status: 'in-progress',
    scope: 'UPS battery swap, thermal audit',
    notes: '',
    attachments: [
      { name: 'thermal-report.pdf', url: '', size: '2.1 MB', type: 'PDF' },
      { name: 'battery-specs.pdf', url: '', size: '800 KB', type: 'PDF' },
      { name: 'ups-diagram.pdf', url: '', size: '1.5 MB', type: 'PDF' },
      { name: 'site-access.pdf', url: '', size: '200 KB', type: 'PDF' },
      { name: 'photos.zip', url: '', size: '12 MB', type: 'Archive' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-3',
    jobNumber: 'JOB-2399',
    company: 'Pinnacle Logistics',
    address: '1200 Commerce Dr, Fort Worth TX',
    contactName: 'James Okafor',
    contactPhone: '(817) 555-0391',
    ktiTime: '6 hrs',
    onSiteTime: '8:00 AM',
    date: '2026-03-17',
    status: 'completed',
    scope: 'Fire alarm panel retrofit, code compliance',
    notes: '',
    attachments: [
      { name: 'inspection-cert.pdf', url: '', size: '500 KB', type: 'PDF' },
      { name: 'panel-wiring.pdf', url: '', size: '1.8 MB', type: 'PDF' },
      { name: 'code-report.pdf', url: '', size: '900 KB', type: 'PDF' },
      { name: 'before-photos.zip', url: '', size: '15 MB', type: 'Archive' },
      { name: 'after-photos.zip', url: '', size: '18 MB', type: 'Archive' },
      { name: 'signoff.pdf', url: '', size: '120 KB', type: 'PDF' },
      { name: 'permit.pdf', url: '', size: '300 KB', type: 'PDF' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-4',
    jobNumber: 'JOB-2398',
    company: 'CrossPoint Electric',
    address: '760 Kirby Dr, Houston TX',
    contactName: 'Dev Patel',
    contactPhone: '(713) 555-0512',
    ktiTime: '3 hrs',
    onSiteTime: '1:00 PM',
    date: '2026-03-19',
    status: 'pending',
    scope: 'Emergency generator test, ATS inspection',
    notes: '',
    attachments: [
      { name: 'gen-specs.pdf', url: '', size: '2.5 MB', type: 'PDF' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-5',
    jobNumber: 'JOB-2397',
    company: 'Zenith Mechanical',
    address: '3300 Westheimer Rd, Houston TX',
    contactName: 'Laura Chen',
    contactPhone: '(281) 555-0688',
    ktiTime: '5 hrs',
    onSiteTime: '9:00 AM',
    date: '2026-03-18',
    status: 'scheduled',
    scope: 'Chiller replacement, piping rework',
    notes: '',
    attachments: [
      { name: 'chiller-manual.pdf', url: '', size: '4.2 MB', type: 'PDF' },
      { name: 'piping-diagram.pdf', url: '', size: '1.1 MB', type: 'PDF' },
      { name: 'permit-mech.pdf', url: '', size: '350 KB', type: 'PDF' },
      { name: 'site-survey.zip', url: '', size: '6 MB', type: 'Archive' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs();
      setJobs(data.length > 0 ? data : SEED_JOBS);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setJobs(SEED_JOBS); // fallback on error too
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Keyboard shortcut — Escape closes panels
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNewJobOpen(false);
        setDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
    setNewJobOpen(false);
  };

  const handleEditClick = (job: Job) => {
    setSelectedJob(job);
    setNewJobOpen(true);
    setDetailOpen(false);
  };

  const handleNewJob = () => {
    setSelectedJob(null);
    setNewJobOpen(true);
    setDetailOpen(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-void)' }}>
      <Sidebar />

      {/* Main — offset by sidebar width */}
      <div className="flex flex-col flex-1" style={{ marginLeft: '260px', minWidth: 0, overflow: 'hidden' }}>
        <Topbar onNewJob={handleNewJob} />

        <main className="flex-1" style={{ padding: '28px 32px' }}>
          {loading ? (
            <div
              className="flex items-center justify-center h-64 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 mr-2"
                style={{ animation: 'spin 0.8s linear infinite' }}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Loading jobs…
            </div>
          ) : (
            <>
              <StatsRow jobs={jobs} />
              <JobsTable
                jobs={jobs}
                onRowClick={handleRowClick}
                onEditClick={handleEditClick}
              />
            </>
          )}
        </main>
      </div>

      {/* Panels */}
      <NewJobPanel
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        onJobCreated={fetchJobs}
      />

      <DetailPanel
        open={detailOpen}
        job={selectedJob}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditClick}
        onJobUpdated={fetchJobs}
      />
    </div>
  );
}