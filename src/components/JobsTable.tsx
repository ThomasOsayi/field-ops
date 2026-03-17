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
      <div className="flex items-center justify-between mb-4">
        <div className="text-base font-bold tracking-tight">All Jobs</div>
        <div className="flex gap-[6px]">
          {filters.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className="flex items-center gap-[5px] px-[14px] py-[6px] rounded-full text-[12px] font-semibold cursor-pointer transition-all duration-150"
                style={{
                  background: isActive ? 'var(--accent-glow-strong)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(76,158,235,0.3)'
                    : '1px solid var(--border)',
                  color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {f.label}
                <span
                  className="text-[10px] font-bold opacity-60"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
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
        className="rounded-[14px] overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Job #', 'Company', 'Site Contact', 'KTI', 'On Site', 'Status', 'Scope', 'Files', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-[18px] py-3 text-[10px] font-bold uppercase tracking-[0.06em]"
                    style={{
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
                  className="cursor-pointer group transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--border)' }}
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
                  <td className="px-[18px] py-[14px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-[3px] h-5 rounded-sm flex-shrink-0"
                        style={{ background: barColor[job.status] }}
                      />
                      <span
                        className="text-[13px] font-bold"
                        style={{
                          color: 'var(--accent)',
                          fontFamily: 'var(--font-jetbrains-mono)',
                        }}
                      >
                        {job.jobNumber}
                      </span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-[18px] py-[14px]">
                    <div className="font-bold text-sm mb-[2px]">{job.company}</div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {job.address}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-[18px] py-[14px]">
                    <div className="font-semibold text-[13px]">{job.contactName}</div>
                    <div
                      className="text-[11px]"
                      style={{
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                      }}
                    >
                      {job.contactPhone}
                    </div>
                  </td>

                  {/* KTI */}
                  <td className="px-[18px] py-[14px]">
                    <span
                      className="text-[12px] font-semibold"
                      style={{
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                      }}
                    >
                      {job.ktiTime}
                    </span>
                  </td>

                  {/* On Site */}
                  <td className="px-[18px] py-[14px]">
                    <span
                      className="text-[12px] font-semibold"
                      style={{
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                      }}
                    >
                      {job.onSiteTime}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-[18px] py-[14px]">
                    <span
                      className="inline-flex items-center gap-[5px] px-[11px] py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.03em]"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      <span
                        className="w-[5px] h-[5px] rounded-full"
                        style={{ background: sc.color }}
                      />
                      {sc.label}
                    </span>
                  </td>

                  {/* Scope */}
                  <td className="px-[18px] py-[14px]">
                    <div
                      className="text-[12px] max-w-[200px] truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {job.scope}
                    </div>
                  </td>

                  {/* Files */}
                  <td className="px-[18px] py-[14px]">
                    <span
                      className="flex items-center gap-[5px] text-[12px]"
                      style={{
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-jetbrains-mono)',
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-[14px] h-[14px]"
                      >
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                      {job.attachments.length}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-[18px] py-[14px]">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {/* Edit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(job);
                        }}
                        className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center transition-all duration-150"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'var(--bg-elevated)';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'var(--bg-surface)';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--text-muted)';
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-[14px] h-[14px]"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* More */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-[30px] h-[30px] rounded-[6px] flex items-center justify-center transition-all duration-150"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'var(--bg-elevated)';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            'var(--bg-surface)';
                          (e.currentTarget as HTMLButtonElement).style.color =
                            'var(--text-muted)';
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-[14px] h-[14px]"
                        >
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
                  className="px-[18px] py-10 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
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