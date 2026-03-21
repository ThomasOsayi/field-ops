'use client';

import { useEffect, useState, useMemo } from 'react';
import { Job } from '@/types/job';
import { onJobsSnapshot } from '@/lib/jobs';
import { useFirestore } from '@/hooks/useFirestore';
import { useAutoProgress } from '@/hooks/useAutoProgress';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import StatsRow from '@/components/StatsRow';
import JobsTable from '@/components/JobsTable';
import NewJobPanel from '@/components/NewJobPanel';
import DetailPanel from '@/components/DetailPanel';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function JobsPage() {
  const { data: jobs, loading } = useFirestore<Job>(onJobsSnapshot, []);
  useAutoProgress(jobs);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setNewJobOpen(false); setDetailOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Filter jobs by search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(j =>
      j.jobNumber.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.contactName.toLowerCase().includes(q) ||
      j.address.toLowerCase().includes(q) ||
      j.scope.toLowerCase().includes(q) ||
      j.contactPhone.includes(q)
    );
  }, [jobs, searchQuery]);

  // Export to CSV
  const handleExport = () => {
    const headers = ['Job #', 'Company', 'Address', 'Contact', 'Phone', 'KTI', 'On Site', 'Date', 'Status', 'Scope', 'Notes'];
    const rows = filteredJobs.map(j => [
      j.jobNumber, j.company, j.address, j.contactName, j.contactPhone,
      j.ktiTime, j.onSiteTime, j.date, j.status, j.scope, j.notes,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldops-jobs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRowClick = (job: Job) => { setSelectedJob(job); setDetailOpen(true); setNewJobOpen(false); };
  const handleEditClick = (job: Job) => { setEditJob(job); setNewJobOpen(true); setDetailOpen(false); };
  const handleNewJob = () => { setEditJob(null); setNewJobOpen(true); setDetailOpen(false); };

  return (
    <ProtectedRoute>
      <div className="jobs-page">
        <Sidebar />
        <div className="jobs-main app-main">
          <Topbar onNewJob={handleNewJob} onSearch={setSearchQuery} onExport={handleExport} />
          <main className="jobs-content">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading jobs…</div>
            ) : (
              <>
                <StatsRow jobs={jobs} />
                <JobsTable jobs={filteredJobs} onRowClick={handleRowClick} onEditClick={handleEditClick} />
                {searchQuery && filteredJobs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.3 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <p style={{ fontSize: '14px', fontWeight: 600 }}>No jobs match &ldquo;{searchQuery}&rdquo;</p>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Try a different search term</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
        <NewJobPanel open={newJobOpen} onClose={() => setNewJobOpen(false)} onJobCreated={() => {}} editJob={editJob} />
        <DetailPanel open={detailOpen} job={selectedJob} onClose={() => setDetailOpen(false)} onEdit={handleEditClick} onJobUpdated={() => {}} />
      </div>

      <style>{`
        .jobs-page {
          display: flex;
          min-height: 100vh;
          background: var(--bg-void);
        }

        .jobs-main {
          margin-left: var(--sidebar-width);
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          min-width: 0;
          overflow: hidden;
        }

        .jobs-content {
          padding: 28px 32px;
          flex: 1;
        }

        @media (max-width: 768px) {
          .jobs-main {
            margin-left: 0;
          }

          .jobs-content {
            padding: 16px;
            padding-bottom: calc(var(--tabbar-height) + 16px);
          }
        }

        @media (max-width: 390px) {
          .jobs-content {
            padding: 12px;
            padding-bottom: calc(var(--tabbar-height) + 12px);
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}