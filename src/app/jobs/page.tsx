'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/types/job';
import { onJobsSnapshot } from '@/lib/jobs';
import { useFirestore } from '@/hooks/useFirestore';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import StatsRow from '@/components/StatsRow';
import JobsTable from '@/components/JobsTable';
import NewJobPanel from '@/components/NewJobPanel';
import DetailPanel from '@/components/DetailPanel';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAutoProgress } from '@/hooks/useAutoProgress';

export default function JobsPage() {
  const { data: jobs, loading } = useFirestore<Job>(onJobsSnapshot, []);
  useAutoProgress(jobs);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setNewJobOpen(false); setDetailOpen(false); }
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
    setEditJob(job);
    setNewJobOpen(true);
    setDetailOpen(false);
  };

  const handleNewJob = () => {
    setEditJob(null);
    setNewJobOpen(true);
    setDetailOpen(false);
  };

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
        <Sidebar />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
          <Topbar onNewJob={handleNewJob} />
          <main style={{ padding: '28px 32px', flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading jobs…</div>
            ) : (
              <>
                <StatsRow jobs={jobs} />
                <JobsTable jobs={jobs} onRowClick={handleRowClick} onEditClick={handleEditClick} />
              </>
            )}
          </main>
        </div>

        <NewJobPanel open={newJobOpen} onClose={() => setNewJobOpen(false)} onJobCreated={() => {}} editJob={editJob} />
        <DetailPanel open={detailOpen} job={selectedJob} onClose={() => setDetailOpen(false)} onEdit={handleEditClick} onJobUpdated={() => {}} />
      </div>
    </ProtectedRoute>
  );
}