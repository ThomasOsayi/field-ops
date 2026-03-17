'use client';

import { Job } from '@/types/job';
import { markJobComplete } from '@/lib/jobs';

interface DetailPanelProps {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onEdit: (job: Job) => void;
  onJobUpdated: () => void;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  scheduled: { label: 'Scheduled', bg: 'var(--accent-glow)', color: 'var(--accent)' },
  'in-progress': { label: 'In Progress', bg: 'var(--warning-muted)', color: 'var(--warning)' },
  completed: { label: 'Completed', bg: 'var(--success-muted)', color: 'var(--success)' },
  pending: { label: 'Pending', bg: 'var(--purple-muted)', color: 'var(--purple)' },
};

const attIconConfig: Record<string, { bg: string; color: string }> = {
  PDF: { bg: 'var(--danger-muted)', color: 'var(--danger)' },
  Archive: { bg: 'var(--accent-glow)', color: 'var(--accent)' },
  default: { bg: 'var(--orange-muted)', color: 'var(--orange)' },
};

export default function DetailPanel({
  open,
  job,
  onClose,
  onEdit,
  onJobUpdated,
}: DetailPanelProps) {
  if (!job) return null;

  const sc = statusConfig[job.status] ?? statusConfig.scheduled;

  const handleMarkComplete = async () => {
    await markJobComplete(job.id);
    onJobUpdated();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] transition-opacity duration-250"
        style={{
          background: 'rgba(6,8,12,0.7)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
        }}
      />

      {/* Panel */}
      <div
        className="fixed top-0 bottom-0 right-0 z-[300] flex flex-col"
        style={{
          width: '620px',
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div className="text-[17px] font-extrabold tracking-tight">Job Detail</div>
              <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                View full job information
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-150"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero */}
          <div
            className="px-7 pt-7 pb-5"
            style={{
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))',
            }}
          >
            <div className="flex items-center gap-[10px] mb-2">
              <span
                className="text-[13px] font-bold"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-jetbrains-mono)',
                }}
              >
                {job.jobNumber}
              </span>
              <span
                className="inline-flex items-center gap-[5px] px-[11px] py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.03em]"
                style={{ background: sc.bg, color: sc.color }}
              >
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: sc.color }} />
                {sc.label}
              </span>
            </div>
            <div className="text-[24px] font-extrabold tracking-tight mb-1">{job.company}</div>
            <div className="flex items-center gap-[6px] text-[13px]" style={{ color: 'var(--text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {job.address}
            </div>
          </div>

          {/* Sections */}
          <div className="px-7 py-6 space-y-6">

            {/* Site Contact */}
            <DetailSection icon="user" label="Site Contact">
              <DCard>
                <DRow label="Name" value={job.contactName} />
                <DRow label="Phone" value={job.contactPhone} mono accent />
              </DCard>
            </DetailSection>

            {/* Schedule */}
            <DetailSection icon="clock" label="Schedule">
              <DCard>
                <DRow label="Date" value={new Date(job.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} mono />
                <DRow label="On Site" value={job.onSiteTime} mono />
                <DRow label="KTI Time" value={job.ktiTime} mono />
                <DRow label="Outlook" value="Synced" synced />
              </DCard>
            </DetailSection>

            {/* Scope */}
            <DetailSection icon="list" label="Scope of Work">
              <div
                className="rounded-[12px] px-4 py-4 text-sm leading-[1.7]"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {job.scope || '—'}
              </div>
            </DetailSection>

            {/* Notes */}
            {job.notes && (
              <DetailSection icon="info" label="Notes">
                <div
                  className="flex gap-[10px] rounded-[12px] px-4 py-[14px] text-[13px] leading-[1.6]"
                  style={{
                    background: 'var(--accent-glow)',
                    border: '1px solid rgba(76,158,235,0.15)',
                    color: 'var(--accent-bright)',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="w-[18px] h-[18px] flex-shrink-0 mt-[2px]" style={{ color: 'var(--accent)' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <div>{job.notes}</div>
                </div>
              </DetailSection>
            )}

            {/* Attachments */}
            {job.attachments.length > 0 && (
              <DetailSection icon="paperclip" label={`Attachments (${job.attachments.length})`}>
                <div className="space-y-2">
                  {job.attachments.map((att, i) => {
                    const ic = attIconConfig[att.type] ?? attIconConfig.default;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 rounded-[10px] cursor-pointer transition-all duration-150"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)')
                        }
                      >
                        <div
                          className="w-[38px] h-[38px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                          style={{ background: ic.bg, color: ic.color }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold">{att.name}</div>
                          <div
                            className="text-[11px]"
                            style={{
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--font-jetbrains-mono)',
                            }}
                          >
                            {att.size} · {att.type}
                          </div>
                        </div>
                        <div style={{ color: 'var(--accent)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DetailSection>
            )}

          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-[18px] flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div />
          <div className="flex gap-[10px]">
            <button
              onClick={() => { onClose(); setTimeout(() => onEdit(job), 350); }}
              className="flex items-center gap-[7px] px-4 py-[9px] rounded-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-dm-sans)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Job
            </button>

            {job.status !== 'completed' && (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-[7px] px-4 py-[9px] rounded-[10px] text-[13px] font-bold text-white cursor-pointer transition-all duration-150"
                style={{
                  background: 'var(--success)',
                  boxShadow: '0 4px 16px rgba(52,211,153,0.3)',
                  border: 'none',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────

function DetailSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon: 'user' | 'clock' | 'list' | 'info' | 'paperclip';
  children: React.ReactNode;
}) {
  const icons: Record<string, React.ReactNode> = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    list: (
      <>
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </>
    ),
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
  };

  return (
    <div>
      <div
        className="flex items-center gap-[7px] text-[11px] font-bold uppercase tracking-[0.06em] mb-[10px]"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
          {icons[icon]}
        </svg>
        {label}
      </div>
      {children}
    </div>
  );
}

function DCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[12px] overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  );
}

function DRow({
  label,
  value,
  mono,
  accent,
  synced,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  synced?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      {synced ? (
        <span className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: 'var(--success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[14px] h-[14px]">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Synced
        </span>
      ) : (
        <span
          className="text-[13px] font-semibold text-right"
          style={{
            color: accent ? 'var(--accent)' : 'var(--text-primary)',
            fontFamily: mono ? 'var(--font-jetbrains-mono)' : 'var(--font-dm-sans)',
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}