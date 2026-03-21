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

export default function ContactDetailPanel({ open, company, jobs, onClose, onEdit, onDelete, onNewJob }: ContactDetailPanelProps) {
  if (!company) return null;

  const companyJobs = jobs.filter((j) => j.company.toLowerCase() === company.name.toLowerCase()).slice(0, 5);
  const color = companyAvatarColor(company.name);
  const initials = companyInitials(company.name);

  return (
    <>
      <div onClick={onClose} className="cdp-overlay" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }} />

      <div className="cdp-panel slide-panel" style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}>
        {/* Header */}
        <div className="cdp-header">
          <div className="cdp-header-desktop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="cdp-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div>
                <div className="cdp-header-title">Company Detail</div>
                <div className="cdp-header-sub">Contacts & job history</div>
              </div>
            </div>
          </div>
          <div className="cdp-header-mobile">
            <button onClick={onClose} className="cdp-back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><polyline points="15 18 9 12 15 6"/></svg>Back
            </button>
            <div className="cdp-header-title-m">Company Detail</div>
          </div>
          <button onClick={onClose} className="cdp-close-btn"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="cdp-body">
          {/* Hero */}
          <div className="cdp-hero">
            <div className="cdp-hero-avatar" style={{ background: color }}>{initials}</div>
            <div className="cdp-hero-name">{company.name}</div>
            <div className="cdp-hero-addr">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {company.address}{company.city ? `, ${company.city}` : ''}
            </div>
          </div>

          <div className="cdp-sections">
            {/* Company Info */}
            <div className="cdp-section">
              <SectionHead icon="building" label="Company Info" />
              <div className="cdp-info-card">
                <InfoRow label="City" value={company.city} />
                <InfoRow label="Total Jobs" value={String(company.jobCount)} mono accent />
                <InfoRow label="Last Job" value={company.lastJobDate ? new Date(company.lastJobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} mono last />
              </div>
            </div>

            {/* Contacts */}
            <div className="cdp-section">
              <SectionHead icon="user" label={`Contacts (${company.contacts.length})`} />
              {company.contacts.map((c, i) => (
                <div key={i} className="cdp-contact-card">
                  <div className="cdp-contact-avatar" style={{ background: companyAvatarColor(c.name) }}>{companyInitials(c.name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{c.role}{c.isPrimary ? ' · Primary' : ''}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', flexWrap: 'wrap' }}>
                      {c.phone && (
                        <a href={`tel:${c.phone.replace(/\D/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontFamily: 'var(--mono)', textDecoration: 'none' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                          {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
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
              <div className="cdp-section">
                <SectionHead icon="jobs" label={`Recent Jobs (${companyJobs.length})`} />
                {companyJobs.map((job) => {
                  const bs = jobStatusBadge[job.status] ?? jobStatusBadge.scheduled;
                  return (
                    <div key={job.id} className="cdp-job-item"
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{job.jobNumber}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.scope}</div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 11px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', background: bs.bg, color: bs.color, flexShrink: 0 }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />{bs.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Notes */}
            {company.notes && (
              <div className="cdp-section">
                <SectionHead icon="edit" label="Notes" />
                <div className="cdp-notes-block">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <div>{company.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="cdp-footer">
          <button onClick={() => onDelete(company)} className="cdp-btn-delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
          <div className="cdp-footer-right">
            <button onClick={() => { onClose(); setTimeout(() => onEdit(company), 350); }} className="cdp-btn-edit"
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
            <button onClick={onNewJob} className="cdp-btn-newjob">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Job
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cdp-overlay { position: fixed; inset: 0; background: rgba(6,8,12,0.7); backdrop-filter: blur(4px); z-index: 200; transition: opacity 0.25s; }

        .cdp-panel {
          position: fixed; top: 0; right: 0; bottom: 0; width: 580px;
          background: var(--bg-sidebar); border-left: 1px solid var(--border);
          z-index: 300; display: flex; flex-direction: column;
          transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .cdp-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .cdp-header-desktop { display: flex; align-items: center; }
        .cdp-header-mobile { display: none; }
        .cdp-header-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-glow); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .cdp-header-title { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
        .cdp-header-sub { font-size: 12px; color: var(--text-muted); }
        .cdp-header-title-m { font-size: 16px; font-weight: 700; }
        .cdp-back-btn { display: flex; align-items: center; gap: 4px; color: var(--accent-bright); font-size: 14px; font-weight: 600; background: none; border: none; cursor: pointer; padding: 8px 4px; -webkit-tap-highlight-color: transparent; }
        .cdp-close-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); background: transparent; border: 1px solid var(--border); transition: all 0.15s; flex-shrink: 0; }

        .cdp-body { flex: 1; overflow-y: auto; padding: 0; }

        .cdp-hero { padding: 28px 28px 20px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05)); }
        .cdp-hero-avatar { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: #fff; margin-bottom: 14px; }
        .cdp-hero-name { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 4px; }
        .cdp-hero-addr { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }

        .cdp-sections { padding: 24px 28px; }
        .cdp-section { margin-bottom: 24px; }
        .cdp-info-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }

        .cdp-contact-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 14px; }
        .cdp-contact-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; }

        .cdp-job-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; cursor: pointer; transition: background 0.15s; }

        .cdp-notes-block { background: var(--accent-glow); border: 1px solid rgba(76,158,235,0.15); border-radius: 12px; padding: 14px 16px; font-size: 13px; color: var(--accent-bright); line-height: 1.6; display: flex; gap: 10px; }

        .cdp-footer { padding: 18px 28px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .cdp-footer-right { display: flex; gap: 10px; }
        .cdp-btn-delete { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 12px; font-weight: 700; cursor: pointer; background: var(--danger-muted); color: var(--danger); border: 1px solid rgba(248,113,113,0.2); transition: all 0.15s; }
        .cdp-btn-edit { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); transition: all 0.15s; }
        .cdp-btn-newjob { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #4C9EEB, #7B61FF); color: #fff; border: none; box-shadow: 0 4px 16px rgba(76,158,235,0.3); transition: all 0.15s; }

        /* ═══ MOBILE ═══ */
        @media (max-width: 768px) {
          .cdp-panel { width: 100% !important; border-left: none; }
          .cdp-overlay { backdrop-filter: none; -webkit-backdrop-filter: none; }

          .cdp-header { padding: 12px 16px; padding-top: max(12px, env(safe-area-inset-top, 12px)); }
          .cdp-header-desktop { display: none; }
          .cdp-header-mobile { display: flex; align-items: center; gap: 12px; flex: 1; }

          .cdp-hero { padding: 20px 16px; text-align: center; }
          .cdp-hero-avatar { margin: 0 auto 12px; width: 56px; height: 56px; border-radius: 14px; font-size: 20px; }
          .cdp-hero-addr { justify-content: center; }

          .cdp-sections { padding: 16px 16px 120px; }
          .cdp-section { margin-bottom: 20px; }
          .cdp-contact-card { padding: 14px; gap: 12px; }

          .cdp-footer {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 310;
            background: var(--bg-sidebar); padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
            flex-direction: row;
          }
          .cdp-btn-delete { font-size: 11px; padding: 10px 12px; min-height: 44px; }
          .cdp-footer-right { display: flex; gap: 8px; }
          .cdp-btn-edit { flex: 1; justify-content: center; padding: 12px 10px; min-height: 48px; font-size: 13px; }
          .cdp-btn-newjob { flex: 1.2; justify-content: center; padding: 12px 10px; min-height: 48px; font-size: 13px; }
        }

        @media (max-width: 390px) {
          .cdp-hero { padding: 16px 14px; }
          .cdp-sections { padding: 14px 14px 120px; }
          .cdp-footer { padding: 10px 14px; padding-bottom: max(10px, env(safe-area-inset-bottom, 10px)); }
        }
      `}</style>
    </>
  );
}

function SectionHead({ icon, label }: { icon: string; label: string }) {
  const iconPaths: Record<string, React.ReactNode> = {
    building: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    jobs: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPaths[icon]}</svg>{label}
    </div>
  );
}

function InfoRow({ label, value, mono, accent, last }: { label: string; value: string; mono?: boolean; accent?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'right', color: accent ? 'var(--accent)' : undefined, fontFamily: mono ? 'var(--mono)' : undefined }}>{value}</span>
    </div>
  );
}