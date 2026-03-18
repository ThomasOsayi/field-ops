'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewJob } from '@/types/job';
import { createJobWithSync } from '@/lib/job-actions';
import { onJobsSnapshot } from '@/lib/jobs';

interface NewJobPanelProps {
  open: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

const KTI_OPTIONS = [
  '1 hr', '2 hrs', '3 hrs', '4 hrs', '5 hrs', '6 hrs',
  '7 hrs', '8 hrs', '9 hrs', '10 hrs', '11 hrs', '12 hrs',
];

const HOUR_OPTIONS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

function getNextJobNumber(existingNumbers: string[]): string {
  let max = 2400;
  existingNumbers.forEach((n) => {
    const match = n.match(/JOB-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > max) max = num;
    }
  });
  return `JOB-${max + 1}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildOnSiteTime(hour: string, minute: string, ampm: string): string {
  return `${hour}:${minute} ${ampm}`;
}

const emptyErrors: Record<string, boolean> = {};

export default function NewJobPanel({ open, onClose, onJobCreated }: NewJobPanelProps) {
  const [jobNumber, setJobNumber] = useState('JOB-2402');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [ktiTime, setKtiTime] = useState('4 hrs');
  const [onSiteHour, setOnSiteHour] = useState('9');
  const [onSiteMinute, setOnSiteMinute] = useState('00');
  const [onSiteAmPm, setOnSiteAmPm] = useState('AM');
  const [date, setDate] = useState(getTodayStr());
  const [status, setStatus] = useState('scheduled');
  const [scope, setScope] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>(emptyErrors);

  // Auto-increment job number from Firestore
  useEffect(() => {
    const unsub = onJobsSnapshot((jobs) => {
      const numbers = jobs.map((j) => j.jobNumber);
      setJobNumber(getNextJobNumber(numbers));
    });
    return () => unsub();
  }, []);

  // Reset form when panel opens
  useEffect(() => {
    if (open) {
      setCompany('');
      setAddress('');
      setContactName('');
      setContactPhone('');
      setKtiTime('4 hrs');
      setOnSiteHour('9');
      setOnSiteMinute('00');
      setOnSiteAmPm('AM');
      setDate(getTodayStr());
      setStatus('scheduled');
      setScope('');
      setNotes('');
      setErrors(emptyErrors);
      setSaved(false);
      setSaving(false);
    }
  }, [open]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!company.trim()) newErrors.company = true;
    if (!address.trim()) newErrors.address = true;
    if (!contactName.trim()) newErrors.contactName = true;
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, '').length < 10) newErrors.contactPhone = true;
    if (!date) newErrors.date = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [company, address, contactName, contactPhone, date]);

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const form: NewJob = {
        jobNumber,
        company: company.trim(),
        address: address.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        ktiTime,
        onSiteTime: buildOnSiteTime(onSiteHour, onSiteMinute, onSiteAmPm),
        date,
        status: status as 'scheduled' | 'in-progress' | 'completed' | 'pending',
        scope: scope.trim(),
        notes: notes.trim(),
        attachments: [],
      };

      await createJobWithSync(form);
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        onJobCreated();
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    setContactPhone(formatPhone(val));
    if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: false }));
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
  };

  /* ── Styles ── */
  const inputBase: React.CSSProperties = {
    background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px',
    padding: '12px 14px', fontFamily: 'var(--font)', fontSize: '14px', fontWeight: 500,
    color: 'var(--text-primary)', outline: 'none', transition: 'all 0.2s', width: '100%',
  };

  const inputError: React.CSSProperties = {
    borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(248,113,113,0.1)',
  };

  const monoInput: React.CSSProperties = { ...inputBase, fontFamily: 'var(--mono)', fontWeight: 500 };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.04em', paddingLeft: '2px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputBase, cursor: 'pointer', appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23556277' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '32px',
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

  const renderErrorHint = (field: string, message: string) =>
    errors[field] ? (
      <div style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 600, marginTop: '4px', paddingLeft: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '10px', height: '10px' }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {message}
      </div>
    ) : null;

  return (
    <>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,8,12,0.7)', backdropFilter: 'blur(4px)' }} />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '620px', zIndex: 300,
        background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

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
          <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ═══ BODY ═══ */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Sync Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.06))', border: '1px solid rgba(76,158,235,0.15)', borderRadius: 'var(--radius-sm)' }}>
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
                  <div style={{ ...monoInput, background: 'var(--bg-surface)', color: 'var(--accent)', fontWeight: 700, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {jobNumber}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', paddingLeft: '2px' }}>Auto-generated from last job</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Company <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input style={{ ...inputBase, ...(errors.company ? inputError : {}) }} placeholder="Company name" value={company} onChange={(e) => { setCompany(e.target.value); clearError('company'); }} onFocus={handleFocus} onBlur={handleBlur} />
                  {renderErrorHint('company', 'Company name is required')}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input style={{ ...inputBase, ...(errors.address ? inputError : {}) }} placeholder="Street, City, State, ZIP" value={address} onChange={(e) => { setAddress(e.target.value); clearError('address'); }} onFocus={handleFocus} onBlur={handleBlur} />
                {renderErrorHint('address', 'Address is required')}
              </div>
            </div>
          </div>

          {/* ── Site Contact ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Site Contact', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)}
            <div style={cardStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Contact Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input style={{ ...inputBase, ...(errors.contactName ? inputError : {}) }} placeholder="Full name" value={contactName} onChange={(e) => { setContactName(e.target.value); clearError('contactName'); }} onFocus={handleFocus} onBlur={handleBlur} />
                  {renderErrorHint('contactName', 'Contact name is required')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Phone Number <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input style={{ ...monoInput, ...(errors.contactPhone ? inputError : {}) }} placeholder="(000) 000-0000" value={contactPhone} onChange={(e) => handlePhoneChange(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} maxLength={14} />
                  {renderErrorHint('contactPhone', 'Valid 10-digit phone required')}
                </div>
              </div>
            </div>
          </div>

          {/* ── Schedule ── */}
          <div style={{ marginBottom: '20px' }}>
            {renderSectionHead('Schedule', <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)}
            <div style={cardStyle}>
              {/* KTI pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <label style={labelStyle}>KTI (Estimated Duration)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {KTI_OPTIONS.map((opt) => (
                    <button key={opt} onClick={() => setKtiTime(opt)} style={{
                      padding: '8px 4px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                      fontFamily: 'var(--mono)', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      background: ktiTime === opt ? 'var(--accent-glow-strong)' : 'var(--bg-input)',
                      color: ktiTime === opt ? 'var(--accent-bright)' : 'var(--text-muted)',
                      outline: ktiTime === opt ? '1px solid rgba(76,158,235,0.3)' : '1px solid var(--border)',
                    }}>
                      {opt.replace(' hrs', 'h').replace(' hr', 'h')}
                    </button>
                  ))}
                </div>
              </div>

              {/* On Site Time — AM/PM picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                <label style={labelStyle}>On Site Time</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select value={onSiteHour} onChange={(e) => setOnSiteHour(e.target.value)} style={{ ...selectStyle, width: '80px', fontFamily: 'var(--mono)' }} onFocus={handleFocus as never} onBlur={handleBlur as never}>
                    {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-muted)' }}>:</span>
                  <select value={onSiteMinute} onChange={(e) => setOnSiteMinute(e.target.value)} style={{ ...selectStyle, width: '80px', fontFamily: 'var(--mono)' }} onFocus={handleFocus as never} onBlur={handleBlur as never}>
                    {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {(['AM', 'PM'] as const).map((v) => (
                      <button key={v} onClick={() => setOnSiteAmPm(v)} style={{
                        padding: '10px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                        border: 'none', fontFamily: 'var(--mono)', transition: 'all 0.15s',
                        background: onSiteAmPm === v ? 'var(--accent-glow-strong)' : 'var(--bg-input)',
                        color: onSiteAmPm === v ? 'var(--accent-bright)' : 'var(--text-muted)',
                      }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Date + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input type="date" style={{ ...monoInput, ...(errors.date ? inputError : {}) }} value={date} onChange={(e) => { setDate(e.target.value); clearError('date'); }} onFocus={handleFocus} onBlur={handleBlur} />
                  {renderErrorHint('date', 'Date is required')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle} onFocus={handleFocus as never} onBlur={handleBlur as never}>
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
                <textarea style={{ ...inputBase, minHeight: '90px', lineHeight: '1.6', resize: 'vertical' as const }} placeholder="Describe the scope of work…" value={scope} onChange={(e) => setScope(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Notes</label>
                <textarea style={{ ...inputBase, minHeight: '70px', lineHeight: '1.6', resize: 'vertical' as const }} placeholder="Gate codes, access info, special instructions…" value={notes} onChange={(e) => setNotes(e.target.value)} onFocus={handleFocus} onBlur={handleBlur} />
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
        select option { background: var(--bg-card); color: var(--text-primary); }
      `}</style>
    </>
  );
}