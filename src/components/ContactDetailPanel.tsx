'use client';

import { CompanyRecord } from '@/types/contact';
import { Job } from '@/types/job';

interface ContactDetailPanelProps {
  open: boolean;
  company: CompanyRecord | null;
  jobs: Job[];
  onClose: () => void;
  onEdit: (company: CompanyRecord) => void;
  onDelete: (company: CompanyRecord) => void;
  onNewJob: () => void;
}

const CONTACT_GRADIENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

const companyAvatarColors = ['var(--accent)', 'var(--purple)', 'var(--success)', 'var(--orange)', 'var(--warning)'];

function companyAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return companyAvatarColors[Math.abs(hash) % companyAvatarColors.length];
}

function companyInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

const jobStatusBadge: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: 'var(--accent-glow)', color: 'var(--accent)', label: 'Scheduled' },
  'in-progress': { bg: 'var(--warning-muted)', color: 'var(--warning)', label: 'In Progress' },
  completed: { bg: 'var(--success-muted)', color: 'var(--success)', label: 'Completed' },
  pending: { bg: 'var(--purple-muted)', color: 'var(--purple)', label: 'Pending' },
};

export default function ContactDetailPanel({
  open, company, jobs, onClose, onEdit, onDelete, onNewJob,
}: ContactDetailPanelProps) {
  if (!company) return null;

  const companyJobs = jobs.filter((j) =>
    j.company.toLowerCase() === company.name.toLowerCase()
  ).slice(0, 5);

  const color = companyAvatarColor(company.name);
  const initials = companyInitials(company.name);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.7)',
          backdropFilter: 'blur(4px)', zIndex: 200,
          opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '580px',
          background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)',
          zIndex: 300, display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>Company Detail</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Contacts & job history</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {/* Hero */}
          <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', color: '#fff', marginBottom: '14px' }}>
              {initials}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>{company.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {company.address}, {company.city}
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {/* Company Info */}
            <div style={{ marginBottom: '24px' }}>
              <ContactSectionHead icon="building" label="Company Info" />
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <ContactInfoRow label="City" value={company.city} />
                <ContactInfoRow label="Total Jobs" value={String(company.jobCount)} mono accent />
                <ContactInfoRow label="Last Job" value={company.lastJobDate ? new Date(company.lastJobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} mono last />
              </div>
            </div>

            {/* Contacts */}
            <div style={{ marginBottom: '24px' }}>
              <ContactSectionHead icon="user" label={`Contacts (${company.contacts.length})`} />
              {company.contacts.map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: companyAvatarColor(c.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0 }}>
                    {companyInitials(c.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{c.role}{c.isPrimary ? ' · Primary' : ''}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                        </svg>
                        {c.phone}
                      </span>
                      {c.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
                            <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/>
                          </svg>
                          {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Jobs */}
            {companyJobs.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <ContactSectionHead icon="jobs" label={`Recent Jobs (${companyJobs.length})`} />
                {companyJobs.map((job) => {
                  const bs = jobStatusBadge[job.status] ?? jobStatusBadge.scheduled;
                  return (
                    <div
                      key={job.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}
                    >
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{job.jobNumber}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.scope}</div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', background: bs.bg, color: bs.color }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                        {bs.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            {company.notes && (
              <div style={{ marginBottom: '24px' }}>
                <ContactSectionHead icon="edit" label="Notes" />
                <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(76,158,235,0.15)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: 'var(--accent-bright)', lineHeight: 1.6, display: 'flex', gap: '10px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <div>{company.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <button
            onClick={() => onDelete(company)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', transition: 'all 0.15s' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { onClose(); setTimeout(() => onEdit(company), 350); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button
              onClick={onNewJob}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: CONTACT_GRADIENT, color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)', transition: 'all 0.15s' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Job
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Helpers ── */

function ContactSectionHead({ icon, label }: { icon: string; label: string }): React.ReactNode {
  const iconPaths: Record<string, React.ReactNode> = {
    building: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    jobs: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPaths[icon]}</svg>
      {label}
    </div>
  );
}

function ContactInfoRow({ label, value, mono, accent, last }: { label: string; value: string; mono?: boolean; accent?: boolean; last?: boolean }): React.ReactNode {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'right', color: accent ? 'var(--accent)' : undefined, fontFamily: mono ? 'var(--mono)' : undefined }}>{value}</span>
    </div>
  );
}