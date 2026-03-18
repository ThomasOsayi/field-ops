'use client';

import { useState } from 'react';
import { NewJob } from '@/types/job';
import { createJobWithSync } from '@/lib/job-actions';

interface NewJobPanelProps {
  open: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

const defaultForm: NewJob = {
  jobNumber: 'JOB-2402',
  company: '',
  address: '',
  contactName: '',
  contactPhone: '',
  ktiTime: '',
  onSiteTime: '',
  date: '',
  status: 'scheduled',
  scope: '',
  notes: '',
  attachments: [],
};

export default function NewJobPanel({ open, onClose, onJobCreated }: NewJobPanelProps) {
  const [form, setForm] = useState<NewJob>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field: keyof NewJob, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await createJobWithSync(form);
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        onJobCreated();
        onClose();
        setSaved(false);
        setForm(defaultForm);
      }, 1200);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  /* ── Reusable inline-style helpers ── */

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '12px 14px',
    fontFamily: 'var(--font)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'all 0.2s',
    width: '100%',
  };

  const monoInputStyle: React.CSSProperties = {
    ...inputStyle,
    fontFamily: 'var(--mono)',
    fontWeight: 500,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    paddingLeft: '2px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '18px',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border-focus)';
    e.target.style.boxShadow = '0 0 0 3px rgba(76,158,235,0.08)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  const renderSectionHead = (label: string, iconPath: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px', paddingLeft: '2px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPath}</svg>
      {label}
    </div>
  );

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(6,8,12,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '620px', zIndex: 300,
          background: 'var(--bg-sidebar)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* ═══ HEADER ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: GRADIENT_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(76,158,235,0.25)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.03em' }}>New Job</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>Fill in job details — auto-syncs to Outlook</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ═══ BODY ═══ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Sync Banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 16px', marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.06))',
            border: '1px solid rgba(76,158,235,0.15)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-glow-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: 'var(--accent)' }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-bright)' }}>Outlook Calendar Connected</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-dim)', marginTop: '1px' }}>This job will auto-sync to your calendar on save</div>
            </div>
          </div>

          {/* ── Job Information ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Job Information', <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>)}
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Job Number</label>
                  <input style={monoInputStyle} value={form.jobNumber} onChange={(e) => set('jobNumber', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Company</label>
                  <input style={inputStyle} placeholder="Company name" value={form.company} onChange={(e) => set('company', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} placeholder="Street, City, State, ZIP" value={form.address} onChange={(e) => set('address', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
          </div>

          {/* ── Site Contact ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Site Contact', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)}
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Contact Name</label>
                  <input style={inputStyle} placeholder="Full name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Phone Number</label>
                  <input style={monoInputStyle} placeholder="(000) 000-0000" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Schedule ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Schedule', <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)}
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>KTI Time</label>
                  <input style={monoInputStyle} placeholder="e.g. 4 hrs" value={form.ktiTime} onChange={(e) => set('ktiTime', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>On Site Time</label>
                  <input type="time" style={monoInputStyle} value={form.onSiteTime} onChange={(e) => set('onSiteTime', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Date</label>
                  <input type="date" style={monoInputStyle} value={form.date} onChange={(e) => set('date', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle} value={form.status} onChange={(e) => set('status', e.target.value)} onFocus={handleFocus as never} onBlur={handleBlur as never}>
                    <option value="scheduled">Scheduled</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Scope & Notes ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Scope & Notes', <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>)}
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <label style={labelStyle}>Scope of Work</label>
                <textarea style={{ ...inputStyle, minHeight: '90px', lineHeight: '1.6', resize: 'vertical' as const }} placeholder="Describe the scope of work…" value={form.scope} onChange={(e) => set('scope', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputStyle, minHeight: '70px', lineHeight: '1.6', resize: 'vertical' as const }} placeholder="Gate codes, access info, special instructions…" value={form.notes} onChange={(e) => set('notes', e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
          </div>

          {/* ── Attachments ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Attachments', <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>)}
            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '28px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-glow)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Drop files or click to upload</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Photos, MOP, Checklists, Permits — PDF, JPG, PNG up to 25MB</div>
            </div>
          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: 'var(--accent)' }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/>
            </svg>
            Will sync to Outlook Calendar
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
            >Cancel</button>
            <button onClick={handleSave} disabled={saving || saved} style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px',
              borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700,
              color: '#fff', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: saved ? 'var(--success)' : GRADIENT_ACCENT,
              boxShadow: saved ? '0 4px 16px rgba(52,211,153,0.3)' : '0 4px 16px rgba(76,158,235,0.3)',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Syncing…
                </>
              ) : saved ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Job Created ✓
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Create Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}