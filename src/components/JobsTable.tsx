'use client';

import { useState } from 'react';
import { Job, JobStatus } from '@/types/job';

interface JobsTableProps {
  jobs: Job[];
  onRowClick: (job: Job) => void;
  onEditClick: (job: Job) => void;
}

const filters: { label: string; value: 'all' | JobStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Pending', value: 'pending' },
];

const statusConfig: Record<JobStatus, { label: string; bg: string; color: string }> = {
  scheduled: { label: 'Scheduled', bg: 'var(--accent-glow)', color: 'var(--accent)' },
  'in-progress': { label: 'In Progress', bg: 'var(--warning-muted)', color: 'var(--warning)' },
  completed: { label: 'Completed', bg: 'var(--success-muted)', color: 'var(--success)' },
  pending: { label: 'Pending', bg: 'var(--purple-muted)', color: 'var(--purple)' },
};

const barColor: Record<string, string> = {
  scheduled: 'var(--accent)',
  'in-progress': 'var(--warning)',
  completed: 'var(--success)',
  pending: 'var(--purple)',
};

export default function JobsTable({ jobs, onRowClick, onEditClick }: JobsTableProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | JobStatus>('all');

  const filtered =
    activeFilter === 'all' ? jobs : jobs.filter((j) => j.status === activeFilter);

  const countFor = (val: 'all' | JobStatus) =>
    val === 'all' ? jobs.length : jobs.filter((j) => j.status === val).length;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>All Jobs</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {filters.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  background: isActive ? 'var(--accent-glow-strong)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(76,158,235,0.3)'
                    : '1px solid var(--border)',
                  color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {f.label}
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: '10px',
                    fontWeight: 700,
                    opacity: 0.6,
                  }}
                >
                  {countFor(f.value)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Job #', 'Company', 'Site Contact', 'KTI', 'On Site', 'Status', 'Scope', 'Files', ''].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '12px 18px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted)',
                      background: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => {
              const sc = statusConfig[job.status];
              return (
                <tr
                  key={job.id}
                  onClick={() => onRowClick(job)}
                  className="group"
                  style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => {
                    Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
                      (td) => ((td as HTMLTableCellElement).style.background = 'var(--bg-hover)')
                    );
                  }}
                  onMouseLeave={(e) => {
                    Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
                      (td) => ((td as HTMLTableCellElement).style.background = '')
                    );
                  }}
                >
                  {/* Job # */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '3px',
                          height: '20px',
                          borderRadius: '2px',
                          background: barColor[job.status],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--mono)',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: 'var(--accent)',
                        }}
                      >
                        {job.jobNumber}
                      </span>
                    </div>
                  </td>

                  {/* Company */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{job.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{job.address}</div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{job.contactName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      {job.contactPhone}
                    </div>
                  </td>

                  {/* KTI */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {job.ktiTime}
                    </span>
                  </td>

                  {/* On Site */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {job.onSiteTime}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 11px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        background: sc.bg,
                        color: sc.color,
                      }}
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: 'currentColor',
                        }}
                      />
                      {sc.label}
                    </span>
                  </td>

                  {/* Scope */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <div
                      style={{
                        maxWidth: '200px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {job.scope}
                    </div>
                  </td>

                  {/* Files */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ width: '14px', height: '14px' }}
                      >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      {job.attachments.length}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 18px', fontSize: '13px', verticalAlign: 'middle' }}>
                    <div
                      className="opacity-0 group-hover:opacity-100"
                      style={{ display: 'flex', gap: '4px', transition: 'opacity 0.15s' }}
                    >
                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(job);
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* More */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{ padding: '40px 18px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}
                >
                  No jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}