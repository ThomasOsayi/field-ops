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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
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
      <div className="flex flex-col flex-1" style={{ marginLeft: '260px' }}>
        <Topbar onNewJob={handleNewJob} />

        <main className="flex-1 px-8 py-7">
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