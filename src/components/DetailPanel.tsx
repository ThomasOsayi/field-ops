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

const attIconConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  PDF: {
    bg: 'var(--danger-muted)',
    color: 'var(--danger)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  Archive: {
    bg: 'var(--accent-glow)',
    color: 'var(--accent)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  default: {
    bg: 'var(--orange-muted)',
    color: 'var(--orange)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
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
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(6,8,12,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '620px',
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border)',
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 28px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>Job Detail</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>View full job information</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              transition: 'all 0.15s',
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 0,
          }}
        >
          {/* Hero */}
          <div
            style={{
              padding: '28px 28px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                }}
              >
                {job.jobNumber}
              </span>
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
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                {sc.label}
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>
              {job.company}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {job.address}
            </div>
          </div>

          {/* Sections */}
          <div style={{ padding: '24px 28px' }}>

            {/* Site Contact */}
            <div style={{ marginBottom: '24px' }}>
              <SectionHead icon="user" label="Site Contact" />
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <DRow label="Name" value={job.contactName} />
                <DRow label="Phone" value={job.contactPhone} mono accent last />
              </div>
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: '24px' }}>
              <SectionHead icon="clock" label="Schedule" />
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <DRow label="Date" value={new Date(job.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} mono />
                <DRow label="On Site" value={job.onSiteTime} mono />
                <DRow label="KTI Time" value={job.ktiTime} mono />
                <DRow label="Outlook" synced last />
              </div>
            </div>

            {/* Scope */}
            <div style={{ marginBottom: '24px' }}>
              <SectionHead icon="list" label="Scope of Work" />
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                }}
              >
                {job.scope || '—'}
              </div>
            </div>

            {/* Notes */}
            {job.notes && (
              <div style={{ marginBottom: '24px' }}>
                <SectionHead icon="edit" label="Notes" />
                <div
                  style={{
                    background: 'var(--accent-glow)',
                    border: '1px solid rgba(76,158,235,0.15)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    color: 'var(--accent-bright)',
                    lineHeight: 1.6,
                    display: 'flex',
                    gap: '10px',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <div>{job.notes}</div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {job.attachments.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <SectionHead icon="paperclip" label={`Attachments (${job.attachments.length})`} />
                {job.attachments.map((att, i) => {
                  const ic = attIconConfig[att.type] ?? attIconConfig.default;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)')
                      }
                    >
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: ic.bg,
                          color: ic.color,
                        }}
                      >
                        {ic.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{att.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                          {att.size} · {att.type}
                        </div>
                      </div>
                      <div style={{ color: 'var(--accent)', cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { onClose(); setTimeout(() => onEdit(job), 350); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                transition: 'all 0.15s',
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Job
            </button>

            {job.status !== 'completed' && (
              <button
                onClick={handleMarkComplete}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  background: 'var(--success)',
                  boxShadow: '0 4px 16px rgba(52,211,153,0.3)',
                  border: 'none',
                  transition: 'all 0.15s',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
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

/* ── Helper components ── */

function SectionHead({ icon, label }: { icon: string; label: string }) {
  const iconPaths: Record<string, React.ReactNode> = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    list: (
      <>
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </>
    ),
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        marginBottom: '10px',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
        {iconPaths[icon]}
      </svg>
      {label}
    </div>
  );
}

function DRow({
  label,
  value,
  mono,
  accent,
  synced,
  last,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  accent?: boolean;
  synced?: boolean;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      {synced ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Synced
        </span>
      ) : (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            textAlign: 'right',
            color: accent ? 'var(--accent)' : undefined,
            fontFamily: mono ? 'var(--mono)' : undefined,
          }}
        >
          {value}
        </span>
      )}
    </div>
  );
}