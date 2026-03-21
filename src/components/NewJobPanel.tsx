'use client';

import { useState, useEffect, useCallback } from 'react';
import { Job, NewJob } from '@/types/job';
import { createJobWithSync, updateJobWithSync } from '@/lib/job-actions';
import { onJobsSnapshot } from '@/lib/jobs';

interface NewJobPanelProps {
  open: boolean;
  onClose: () => void;
  onJobCreated: () => void;
  editJob?: Job | null;
}

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';
const KTI_OPTIONS = ['1 hr', '2 hrs', '3 hrs', '4 hrs', '5 hrs', '6 hrs', '7 hrs', '8 hrs', '9 hrs', '10 hrs', '11 hrs', '12 hrs'];
const HOUR_OPTIONS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINUTE_OPTIONS = ['00', '15', '30', '45'];

function getNextJobNumber(existingNumbers: string[]): string {
  let max = 2400;
  existingNumbers.forEach(n => { const m = n.match(/JOB-(\d+)/); if (m) { const num = parseInt(m[1]); if (num > max) max = num; } });
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

function parseOnSiteTime(timeStr: string): { hour: string; minute: string; ampm: string } {
  const ampmMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampmMatch) return { hour: ampmMatch[1], minute: ampmMatch[2], ampm: ampmMatch[3].toUpperCase() };
  const milMatch = timeStr.match(/(\d+):(\d+)/);
  if (milMatch) {
    let h = parseInt(milMatch[1]);
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { hour: String(h), minute: milMatch[2], ampm };
  }
  return { hour: '9', minute: '00', ampm: 'AM' };
}

const emptyErrors: Record<string, boolean> = {};

export default function NewJobPanel({ open, onClose, onJobCreated, editJob }: NewJobPanelProps) {
  const isEdit = !!editJob;

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

  useEffect(() => {
    if (isEdit) return;
    const unsub = onJobsSnapshot(jobs => {
      const numbers = jobs.map(j => j.jobNumber);
      setJobNumber(getNextJobNumber(numbers));
    });
    return () => unsub();
  }, [isEdit]);

  useEffect(() => {
    if (!open) return;
    setErrors(emptyErrors);
    setSaved(false);
    setSaving(false);

    if (editJob) {
      setJobNumber(editJob.jobNumber);
      setCompany(editJob.company);
      setAddress(editJob.address);
      setContactName(editJob.contactName);
      setContactPhone(editJob.contactPhone);
      setKtiTime(editJob.ktiTime);
      const parsed = parseOnSiteTime(editJob.onSiteTime);
      setOnSiteHour(parsed.hour);
      setOnSiteMinute(parsed.minute);
      setOnSiteAmPm(parsed.ampm);
      setDate(editJob.date);
      setStatus(editJob.status);
      setScope(editJob.scope);
      setNotes(editJob.notes);
    } else {
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
    }
  }, [open, editJob]);

  const validate = useCallback((): boolean => {
    const e: Record<string, boolean> = {};
    if (!company.trim()) e.company = true;
    if (!address.trim()) e.address = true;
    if (!contactName.trim()) e.contactName = true;
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, '').length < 10) e.contactPhone = true;
    if (!date) e.date = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [company, address, contactName, contactPhone, date]);

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const onSiteTime = `${onSiteHour}:${onSiteMinute} ${onSiteAmPm}`;
      const formData = {
        company: company.trim(), address: address.trim(), contactName: contactName.trim(),
        contactPhone: contactPhone.trim(), ktiTime, onSiteTime, date,
        status: status as 'scheduled' | 'in-progress' | 'completed' | 'pending',
        scope: scope.trim(), notes: notes.trim(),
      };

      if (isEdit && editJob) {
        await updateJobWithSync(editJob.id, formData, { ...editJob, ...formData });
      } else {
        const newJob: NewJob = { ...formData, jobNumber, attachments: [] };
        await createJobWithSync(newJob);
      }

      setSaving(false);
      setSaved(true);
      setTimeout(() => { onJobCreated(); onClose(); }, 1200);
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handlePhoneChange = (val: string) => { setContactPhone(formatPhone(val)); if (errors.contactPhone) setErrors(p => ({ ...p, contactPhone: false })); };
  const clearError = (field: string) => { if (errors[field]) setErrors(p => ({ ...p, [field]: false })); };

  const renderSectionHead = (label: string, iconPath: React.ReactNode) => (
    <div className="njp-section-head">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPath}</svg>{label}
    </div>
  );

  const renderErrorHint = (field: string, message: string) => errors[field] ? (
    <div className="njp-error-hint">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '10px', height: '10px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{message}
    </div>
  ) : null;

  return (
    <>
      {open && <div onClick={onClose} className="njp-overlay panel-overlay" />}

      <div className="njp-panel slide-panel" style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        {/* ── Header ── */}
        <div className="njp-header">
          {/* Desktop header */}
          <div className="njp-header-desktop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="njp-header-mark" style={{ background: isEdit ? 'var(--accent-glow)' : GRADIENT_ACCENT, boxShadow: isEdit ? 'none' : '0 4px 16px rgba(76,158,235,0.25)' }}>
                {isEdit ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px', color: 'var(--accent)' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                )}
              </div>
              <div>
                <div className="njp-header-title">{isEdit ? 'Edit Job' : 'New Job'}</div>
                <div className="njp-header-sub">{isEdit ? `Editing ${editJob?.jobNumber}` : 'Fill in job details — auto-syncs to Outlook'}</div>
              </div>
            </div>
          </div>

          {/* Mobile header */}
          <div className="njp-header-mobile">
            <button onClick={onClose} className="njp-back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
            <div className="njp-header-title-mobile">{isEdit ? 'Edit Job' : 'New Job'}</div>
          </div>

          <button onClick={onClose} className="njp-close-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="njp-body">

          {/* Sync Banner */}
          <div className="njp-sync-banner">
            <div className="njp-sync-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: 'var(--accent)' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-bright)' }}>Outlook Calendar Connected</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-dim)', marginTop: '1px' }}>{isEdit ? 'Changes will sync to your calendar' : 'This job will auto-sync to your calendar on save'}</div>
            </div>
          </div>

          {/* Job Information */}
          <div className="njp-form-section">
            {renderSectionHead('Job Information', <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>)}
            <div className="njp-card">
              <div className="njp-row-2col">
                <div className="njp-field">
                  <label className="njp-label">Job Number</label>
                  <div className="njp-input njp-input-mono njp-input-readonly">{jobNumber}</div>
                  {!isEdit && <div className="njp-hint">Auto-generated from last job</div>}
                </div>
                <div className="njp-field">
                  <label className="njp-label">Company <span className="njp-req">*</span></label>
                  <input className={`njp-input ${errors.company ? 'njp-input-error' : ''}`} placeholder="Company name" value={company} onChange={e => { setCompany(e.target.value); clearError('company'); }} />
                  {renderErrorHint('company', 'Company name is required')}
                </div>
              </div>
              <div className="njp-field">
                <label className="njp-label">Address <span className="njp-req">*</span></label>
                <input className={`njp-input ${errors.address ? 'njp-input-error' : ''}`} placeholder="Street, City, State, ZIP" value={address} onChange={e => { setAddress(e.target.value); clearError('address'); }} />
                {renderErrorHint('address', 'Address is required')}
              </div>
            </div>
          </div>

          {/* Site Contact */}
          <div className="njp-form-section">
            {renderSectionHead('Site Contact', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)}
            <div className="njp-card">
              <div className="njp-row-2col">
                <div className="njp-field">
                  <label className="njp-label">Contact Name <span className="njp-req">*</span></label>
                  <input className={`njp-input ${errors.contactName ? 'njp-input-error' : ''}`} placeholder="Full name" value={contactName} onChange={e => { setContactName(e.target.value); clearError('contactName'); }} />
                  {renderErrorHint('contactName', 'Contact name is required')}
                </div>
                <div className="njp-field">
                  <label className="njp-label">Phone Number <span className="njp-req">*</span></label>
                  <input className={`njp-input njp-input-mono ${errors.contactPhone ? 'njp-input-error' : ''}`} placeholder="(000) 000-0000" value={contactPhone} onChange={e => handlePhoneChange(e.target.value)} maxLength={14} inputMode="tel" />
                  {renderErrorHint('contactPhone', 'Valid 10-digit phone required')}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="njp-form-section">
            {renderSectionHead('Schedule', <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)}
            <div className="njp-card">
              <div className="njp-field">
                <label className="njp-label">KTI (Estimated Duration)</label>
                <div className="njp-kti-grid">
                  {KTI_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setKtiTime(opt)} className={`njp-kti-btn ${ktiTime === opt ? 'njp-kti-btn-active' : ''}`}>
                      {opt.replace(' hrs', 'h').replace(' hr', 'h')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="njp-field">
                <label className="njp-label">On Site Time</label>
                <div className="njp-time-row">
                  <select value={onSiteHour} onChange={e => setOnSiteHour(e.target.value)} className="njp-select njp-input-mono njp-time-select">{HOUR_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}</select>
                  <span className="njp-time-colon">:</span>
                  <select value={onSiteMinute} onChange={e => setOnSiteMinute(e.target.value)} className="njp-select njp-input-mono njp-time-select">{MINUTE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}</select>
                  <div className="njp-ampm-toggle">
                    {(['AM', 'PM'] as const).map(v => (
                      <button key={v} onClick={() => setOnSiteAmPm(v)} className={`njp-ampm-btn ${onSiteAmPm === v ? 'njp-ampm-btn-active' : ''}`}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="njp-row-2col">
                <div className="njp-field">
                  <label className="njp-label">Date <span className="njp-req">*</span></label>
                  <input type="date" className={`njp-input njp-input-mono ${errors.date ? 'njp-input-error' : ''}`} value={date} onChange={e => { setDate(e.target.value); clearError('date'); }} />
                  {renderErrorHint('date', 'Date is required')}
                </div>
                <div className="njp-field">
                  <label className="njp-label">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="njp-select">
                    <option value="scheduled">Scheduled</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Scope & Notes */}
          <div className="njp-form-section">
            {renderSectionHead('Scope & Notes', <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>)}
            <div className="njp-card">
              <div className="njp-field">
                <label className="njp-label">Scope of Work</label>
                <textarea className="njp-input njp-textarea" placeholder="Describe the scope of work…" value={scope} onChange={e => setScope(e.target.value)} />
              </div>
              <div className="njp-field">
                <label className="njp-label">Notes</label>
                <textarea className="njp-input njp-textarea njp-textarea-short" placeholder="Gate codes, access info, special instructions…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="njp-footer">
          <div className="njp-footer-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: 'var(--accent)' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
            <span className="njp-footer-info-text">Will sync to Outlook Calendar</span>
          </div>
          <div className="njp-footer-btns">
            <button onClick={onClose} className="njp-btn-cancel">Cancel</button>
            <button onClick={handleSave} disabled={saving || saved} className={`njp-btn-save ${saved ? 'njp-btn-save-success' : ''}`} style={{ opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Syncing…' : saved ? (isEdit ? 'Job Updated ✓' : 'Job Created ✓') : (isEdit ? 'Save Changes' : 'Create Job')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ═══ OVERLAY ═══ */
        .njp-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(6,8,12,0.7);
          backdrop-filter: blur(4px);
        }

        /* ═══ PANEL — DESKTOP ═══ */
        .njp-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 620px;
          z-index: 300;
          background: var(--bg-sidebar);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }

        /* ── Header ── */
        .njp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .njp-header-desktop { display: flex; align-items: center; }
        .njp-header-mobile { display: none; }

        .njp-header-mark {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }

        .njp-header-title { font-size: 18px; font-weight: 800; letter-spacing: -0.03em; }
        .njp-header-sub { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
        .njp-header-title-mobile { font-size: 16px; font-weight: 700; }

        .njp-back-btn {
          display: flex; align-items: center; gap: 4px;
          color: var(--accent-bright); font-size: 14px; font-weight: 600;
          background: none; border: none; cursor: pointer; padding: 8px 4px;
          -webkit-tap-highlight-color: transparent;
        }

        .njp-close-btn {
          width: 36px; height: 36px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-muted); background: transparent;
          border: 1px solid var(--border); flex-shrink: 0; transition: all 0.15s;
        }
        .njp-close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        /* ── Body ── */
        .njp-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 28px;
        }

        .njp-sync-banner {
          display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 20px;
          background: linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.06));
          border: 1px solid rgba(76,158,235,0.15); border-radius: var(--radius-sm);
        }

        .njp-sync-icon {
          width: 36px; height: 36px; border-radius: 10px; background: var(--accent-glow-strong);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .njp-form-section { margin-bottom: 20px; }

        .njp-section-head {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--text-muted);
          margin-bottom: 10px; padding-left: 2px;
        }

        .njp-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 12px; padding: 18px;
        }

        .njp-row-2col {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;
        }
        .njp-row-2col:last-child { margin-bottom: 0; }

        .njp-field {
          display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;
        }
        .njp-field:last-child { margin-bottom: 0; }
        .njp-row-2col .njp-field { margin-bottom: 0; }

        .njp-label {
          font-size: 11px; font-weight: 600; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.04em; padding-left: 2px;
        }

        .njp-req { color: var(--danger); }

        .njp-input {
          background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
          padding: 12px 14px; font-family: var(--font); font-size: 14px; font-weight: 500;
          color: var(--text-primary); outline: none; transition: all 0.2s; width: 100%;
        }
        .njp-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(76,158,235,0.08); }
        .njp-input::placeholder { color: var(--text-muted); }
        .njp-input-mono { font-family: var(--mono); font-weight: 500; }
        .njp-input-readonly { background: var(--bg-surface); color: var(--accent); font-weight: 700; cursor: default; }
        .njp-input-error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(248,113,113,0.1) !important; }

        .njp-hint { font-size: 9px; color: var(--text-muted); padding-left: 2px; }

        .njp-error-hint {
          font-size: 10px; color: var(--danger); font-weight: 600; margin-top: 2px;
          padding-left: 2px; display: flex; align-items: center; gap: 4px;
        }

        .njp-textarea {
          min-height: 90px; line-height: 1.6; resize: vertical;
        }
        .njp-textarea-short { min-height: 70px; }

        .njp-select {
          background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px;
          padding: 12px 14px; font-family: var(--font); font-size: 14px; font-weight: 500;
          color: var(--text-primary); outline: none; transition: all 0.2s; width: 100%;
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23556277' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
        }
        .njp-select:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(76,158,235,0.08); }

        /* KTI Grid */
        .njp-kti-grid {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;
        }

        .njp-kti-btn {
          padding: 8px 4px; border-radius: 6px; font-size: 11px; font-weight: 700;
          font-family: var(--mono); cursor: pointer; border: none; transition: all 0.15s;
          background: var(--bg-input); color: var(--text-muted);
          outline: 1px solid var(--border);
        }
        .njp-kti-btn-active {
          background: var(--accent-glow-strong); color: var(--accent-bright);
          outline: 1px solid rgba(76,158,235,0.3);
        }

        /* Time Row */
        .njp-time-row {
          display: flex; gap: 8px; align-items: center;
        }
        .njp-time-select { width: 80px; }
        .njp-time-colon { font-size: 18px; font-weight: 700; color: var(--text-muted); }

        .njp-ampm-toggle {
          display: flex; border-radius: 6px; overflow: hidden; border: 1px solid var(--border);
        }
        .njp-ampm-btn {
          padding: 10px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
          border: none; font-family: var(--mono); transition: all 0.15s;
          background: var(--bg-input); color: var(--text-muted);
        }
        .njp-ampm-btn-active { background: var(--accent-glow-strong); color: var(--accent-bright); }

        /* ── Footer ── */
        .njp-footer {
          padding: 18px 28px; border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; background: var(--bg-surface);
        }

        .njp-footer-info {
          display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted);
        }

        .njp-footer-btns { display: flex; gap: 10px; }

        .njp-btn-cancel {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px;
          border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px;
          font-weight: 700; cursor: pointer; background: var(--bg-card);
          color: var(--text-secondary); border: 1px solid var(--border); transition: all 0.15s;
        }
        .njp-btn-cancel:hover { background: var(--bg-elevated); color: var(--text-primary); }

        .njp-btn-save {
          display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px;
          border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px;
          font-weight: 700; color: #fff; cursor: pointer; border: none;
          background: ${GRADIENT_ACCENT}; box-shadow: 0 4px 16px rgba(76,158,235,0.3);
          transition: all 0.15s;
        }
        .njp-btn-save:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(76,158,235,0.4); }
        .njp-btn-save-success { background: var(--success) !important; box-shadow: 0 4px 16px rgba(52,211,153,0.3) !important; }

        /* ═══ MOBILE — ≤768px ═══ */
        @media (max-width: 768px) {
          /* Full screen */
          .njp-panel {
            width: 100% !important;
            border-left: none;
          }

          .njp-overlay {
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }

          /* Header: show mobile, hide desktop */
          .njp-header {
            padding: 12px 16px;
            padding-top: max(12px, env(safe-area-inset-top, 12px));
          }
          .njp-header-desktop { display: none; }
          .njp-header-mobile {
            display: flex; align-items: center; gap: 12px; flex: 1;
          }

          /* Body: tighter padding, bottom space for footer */
          .njp-body {
            padding: 16px 16px 120px;
          }

          .njp-sync-banner { padding: 12px 14px; gap: 10px; margin-bottom: 16px; }
          .njp-sync-icon { width: 32px; height: 32px; border-radius: 8px; }
          .njp-sync-banner div > div:first-child { font-size: 12px; }
          .njp-sync-banner div > div:last-child { font-size: 10px; }

          .njp-card { padding: 14px; }
          .njp-form-section { margin-bottom: 16px; }

          /* Stack 2-col rows on mobile */
          .njp-row-2col {
            grid-template-columns: 1fr;
            gap: 0;
          }
          .njp-row-2col .njp-field { margin-bottom: 14px; }
          .njp-row-2col .njp-field:last-child { margin-bottom: 0; }

          /* KTI grid: 4 columns on mobile */
          .njp-kti-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .njp-kti-btn { padding: 10px 4px; font-size: 12px; min-height: 44px; }

          /* Time row: wrap on narrow screens */
          .njp-time-row { flex-wrap: wrap; }
          .njp-time-select { width: 70px; }
          .njp-ampm-btn { padding: 10px 16px; min-height: 44px; }

          /* Textareas: smaller */
          .njp-textarea { min-height: 80px; }
          .njp-textarea-short { min-height: 60px; }

          /* Footer: fixed bottom bar */
          .njp-footer {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 310;
            background: var(--bg-sidebar);
            padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
            flex-direction: column;
            gap: 10px;
          }

          .njp-footer-info { display: none; }

          .njp-footer-btns {
            width: 100%; display: flex; gap: 10px;
          }

          .njp-btn-cancel {
            flex: 1; justify-content: center;
            padding: 14px 12px; min-height: 48px; font-size: 14px;
          }

          .njp-btn-save {
            flex: 1.3; justify-content: center;
            padding: 14px 12px; min-height: 48px; font-size: 14px;
          }
        }

        /* ═══ SMALL MOBILE — ≤390px ═══ */
        @media (max-width: 390px) {
          .njp-body { padding: 14px 14px 120px; }
          .njp-card { padding: 12px; }
          .njp-kti-grid { grid-template-columns: repeat(3, 1fr); }
          .njp-footer { padding: 10px 14px; padding-bottom: max(10px, env(safe-area-inset-bottom, 10px)); }
        }

        select option { background: var(--bg-card); color: var(--text-primary); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}