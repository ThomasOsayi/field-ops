'use client';

import { useState } from 'react';
import { NewJob } from '@/types/job';
import { createJob } from '@/lib/jobs';

interface NewJobPanelProps {
  open: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

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
      await createJob(form);
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
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div className="text-[17px] font-extrabold tracking-tight">New Job</div>
              <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Fill in job details — syncs to Outlook
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
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-7">

          {/* Job Info */}
          <Section icon="file" label="Job Information">
            <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
              <Field label="Job Number">
                <input className="form-input font-mono" value={form.jobNumber}
                  onChange={(e) => set('jobNumber', e.target.value)} />
              </Field>
              <Field label="Company">
                <input className="form-input" placeholder="Company name" value={form.company}
                  onChange={(e) => set('company', e.target.value)} />
              </Field>
            </div>
            <Field label="Address">
              <input className="form-input" placeholder="Street, City, State, ZIP" value={form.address}
                onChange={(e) => set('address', e.target.value)} />
            </Field>
          </Section>

          {/* Site Contact */}
          <Section icon="user" label="Site Contact">
            <div className="grid grid-cols-2 gap-[14px]">
              <Field label="Contact Name">
                <input className="form-input" placeholder="Full name" value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)} />
              </Field>
              <Field label="Contact Number">
                <input className="form-input font-mono" placeholder="(000) 000-0000" value={form.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Schedule */}
          <Section icon="clock" label="Schedule">
            {/* Outlook sync info */}
            <div
              className="flex items-center gap-[10px] px-4 py-3 rounded-[10px] mb-[14px]"
              style={{
                background: 'var(--accent-glow)',
                border: '1px solid rgba(76,158,235,0.15)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="w-[18px] h-[18px] flex-shrink-0" style={{ color: 'var(--accent)' }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <polyline points="22,7 12,13 2,7"/>
              </svg>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--accent-bright)' }}>
                Auto-syncs to Outlook Calendar on save
              </span>
            </div>
            <div className="grid grid-cols-2 gap-[14px] mb-[14px]">
              <Field label="KTI Time">
                <input className="form-input font-mono" placeholder="e.g. 4 hrs" value={form.ktiTime}
                  onChange={(e) => set('ktiTime', e.target.value)} />
              </Field>
              <Field label="On Site Time">
                <input className="form-input font-mono" type="time" value={form.onSiteTime}
                  onChange={(e) => set('onSiteTime', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-[14px]">
              <Field label="Date">
                <input className="form-input font-mono" type="date" value={form.date}
                  onChange={(e) => set('date', e.target.value)} />
              </Field>
              <Field label="Status">
                <select className="form-input" value={form.status}
                  onChange={(e) => set('status', e.target.value)}>
                  <option value="scheduled">Scheduled</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Scope & Notes */}
          <Section icon="list" label="Scope & Notes">
            <Field label="Scope of Work">
              <textarea className="form-input" placeholder="Describe the scope of work…"
                style={{ minHeight: '90px', lineHeight: '1.6', resize: 'vertical' }}
                value={form.scope} onChange={(e) => set('scope', e.target.value)} />
            </Field>
            <div className="mt-[14px]">
              <Field label="Notes">
                <textarea className="form-input" placeholder="Gate codes, access info, special instructions…"
                  style={{ minHeight: '70px', lineHeight: '1.6', resize: 'vertical' }}
                  value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </Field>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-[18px] flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="w-4 h-4" style={{ color: 'var(--accent)' }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="22,7 12,13 2,7"/>
            </svg>
            Will sync to Outlook Calendar
          </div>
          <div className="flex gap-[10px]">
            <button
              onClick={onClose}
              className="flex items-center gap-[7px] px-4 py-[9px] rounded-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-[7px] px-4 py-[9px] rounded-[10px] text-[13px] font-bold text-white cursor-pointer transition-all duration-150"
              style={{
                background: saved
                  ? 'var(--success)'
                  : 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
                boxShadow: saved
                  ? '0 4px 16px rgba(52,211,153,0.3)'
                  : '0 4px 16px rgba(76,158,235,0.3)',
                border: 'none',
                fontFamily: 'var(--font-dm-sans)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="w-4 h-4" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Syncing…
                </>
              ) : saved ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Job Created ✓
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
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
        .form-input {
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 14px;
          font-family: var(--font-dm-sans);
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        .form-input:focus { border-color: var(--border-focus); }
        .form-input::placeholder { color: var(--text-muted); }
        .font-mono { font-family: var(--font-jetbrains-mono) !important; font-weight: 500; }
        select.form-input option { background: var(--bg-card); }
      `}</style>
    </>
  );
}

// ── Small helpers ──────────────────────────────────────────

function Section({
  label,
  icon,
  children,
}: {
  label: string;
  icon: 'file' | 'user' | 'clock' | 'list';
  children: React.ReactNode;
}) {
  const icons = {
    file: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    list: (
      <>
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </>
    ),
  };

  return (
    <div className="mb-7">
      <div
        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em] mb-4 pb-[10px]"
        style={{
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
        }}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}