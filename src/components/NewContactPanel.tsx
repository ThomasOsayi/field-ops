'use client';

import { useState, useEffect } from 'react';
import { CompanyRecord, NewCompanyRecord } from '@/types/contact';
import { createCompany, updateCompany } from '@/lib/contacts';

interface NewContactPanelProps {
  open: boolean;
  editingCompany: CompanyRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function NewContactPanel({ open, editingCompany, onClose, onSaved }: NewContactPanelProps) {
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = !!editingCompany;

  useEffect(() => {
    if (editingCompany) {
      setCompanyName(editingCompany.name); setCity(editingCompany.city); setAddress(editingCompany.address); setNotes(editingCompany.notes);
      const primary = editingCompany.contacts.find((c) => c.isPrimary) ?? editingCompany.contacts[0];
      if (primary) { setContactName(primary.name); setContactRole(primary.role); setContactPhone(primary.phone); setContactEmail(primary.email); }
    } else {
      setCompanyName(''); setCity(''); setAddress(''); setContactName(''); setContactRole(''); setContactPhone(''); setContactEmail(''); setNotes('');
    }
  }, [editingCompany, open]);

  const handleSave = async () => {
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      const data: NewCompanyRecord = {
        name: companyName.trim(), address: address.trim(), city: city.trim(),
        contacts: [{ name: contactName.trim(), role: contactRole.trim(), phone: contactPhone.trim(), email: contactEmail.trim(), isPrimary: true }],
        notes: notes.trim(), jobCount: editingCompany?.jobCount ?? 0, lastJobDate: editingCompany?.lastJobDate ?? '',
      };
      if (isEditing) { await updateCompany(editingCompany.id, data); } else { await createCompany(data); }
      onSaved(); onClose();
    } catch (err) { console.error('Failed to save contact:', err); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div onClick={onClose} className="ncp-overlay panel-overlay" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }} />

      <div className="ncp-panel slide-panel" style={{ transform: open ? 'translateX(0)' : 'translateX(100%)' }}>
        {/* Header */}
        <div className="ncp-header">
          <div className="ncp-header-desktop">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="ncp-header-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <div className="ncp-header-title">{isEditing ? 'Edit Contact' : 'Add Contact'}</div>
                <div className="ncp-header-sub">{isEditing ? 'Update company & contact info' : 'New company & contact info'}</div>
              </div>
            </div>
          </div>
          <div className="ncp-header-mobile">
            <button onClick={onClose} className="ncp-back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><polyline points="15 18 9 12 15 6"/></svg>Back
            </button>
            <div className="ncp-header-title-m">{isEditing ? 'Edit Contact' : 'Add Contact'}</div>
          </div>
          <button onClick={onClose} className="ncp-close-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="ncp-body">
          {/* Company */}
          <div className="ncp-form-section">
            <FormSectionHead icon="building" label="Company" />
            <div className="ncp-row-2col">
              <div className="ncp-field"><label className="ncp-label">Company Name</label><input type="text" placeholder="Company name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="ncp-input" /></div>
              <div className="ncp-field"><label className="ncp-label">City</label><input type="text" placeholder="City, State" value={city} onChange={e => setCity(e.target.value)} className="ncp-input" /></div>
            </div>
            <div className="ncp-field"><label className="ncp-label">Address</label><input type="text" placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} className="ncp-input" /></div>
          </div>

          {/* Contact Person */}
          <div className="ncp-form-section">
            <FormSectionHead icon="user" label="Contact Person" />
            <div className="ncp-row-2col">
              <div className="ncp-field"><label className="ncp-label">Full Name</label><input type="text" placeholder="Contact name" value={contactName} onChange={e => setContactName(e.target.value)} className="ncp-input" /></div>
              <div className="ncp-field"><label className="ncp-label">Role</label><input type="text" placeholder="e.g. Site Manager" value={contactRole} onChange={e => setContactRole(e.target.value)} className="ncp-input" /></div>
            </div>
            <div className="ncp-row-2col">
              <div className="ncp-field"><label className="ncp-label">Phone</label><input type="tel" placeholder="(000) 000-0000" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="ncp-input ncp-input-mono" inputMode="tel" /></div>
              <div className="ncp-field"><label className="ncp-label">Email</label><input type="email" placeholder="email@company.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="ncp-input" /></div>
            </div>
          </div>

          {/* Notes */}
          <div className="ncp-form-section">
            <FormSectionHead icon="edit" label="Notes" />
            <textarea placeholder="Gate codes, access info, parking, preferred hours…" value={notes} onChange={e => setNotes(e.target.value)} className="ncp-input ncp-textarea" />
          </div>
        </div>

        {/* Footer */}
        <div className="ncp-footer">
          <div className="ncp-footer-spacer" />
          <div className="ncp-footer-btns">
            <button onClick={onClose} className="ncp-btn-cancel">Cancel</button>
            <button onClick={handleSave} disabled={saving} className={`ncp-btn-save ${saving ? 'ncp-btn-saving' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Contact'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ncp-overlay { position: fixed; inset: 0; background: rgba(6,8,12,0.7); backdrop-filter: blur(4px); z-index: 200; transition: opacity 0.25s; }

        .ncp-panel {
          position: fixed; top: 0; right: 0; bottom: 0; width: 580px;
          background: var(--bg-sidebar); border-left: 1px solid var(--border);
          z-index: 300; display: flex; flex-direction: column;
          transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
        }

        .ncp-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .ncp-header-desktop { display: flex; align-items: center; }
        .ncp-header-mobile { display: none; }
        .ncp-header-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--accent-glow); display: flex; align-items: center; justify-content: center; color: var(--accent); }
        .ncp-header-title { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
        .ncp-header-sub { font-size: 12px; color: var(--text-muted); }
        .ncp-header-title-m { font-size: 16px; font-weight: 700; }
        .ncp-back-btn { display: flex; align-items: center; gap: 4px; color: var(--accent-bright); font-size: 14px; font-weight: 600; background: none; border: none; cursor: pointer; padding: 8px 4px; -webkit-tap-highlight-color: transparent; }
        .ncp-close-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); background: transparent; border: 1px solid var(--border); flex-shrink: 0; transition: all 0.15s; }
        .ncp-close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        .ncp-body { flex: 1; overflow-y: auto; padding: 28px; }
        .ncp-form-section { margin-bottom: 28px; }
        .ncp-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .ncp-row-2col:last-child { margin-bottom: 0; }
        .ncp-field { display: flex; flex-direction: column; gap: 6px; }
        .ncp-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

        .ncp-input { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 11px 14px; font-family: var(--font); font-size: 14px; color: var(--text-primary); outline: none; width: 100%; transition: border-color 0.2s; }
        .ncp-input:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(76,158,235,0.08); }
        .ncp-input::placeholder { color: var(--text-muted); }
        .ncp-input-mono { font-family: var(--mono); }
        .ncp-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }

        .ncp-footer { padding: 18px 28px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .ncp-footer-spacer { flex: 1; }
        .ncp-footer-btns { display: flex; gap: 10px; }
        .ncp-btn-cancel { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); transition: all 0.15s; }
        .ncp-btn-cancel:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .ncp-btn-save { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #4C9EEB, #7B61FF); color: #fff; border: none; box-shadow: 0 4px 16px rgba(76,158,235,0.3); transition: all 0.15s; }
        .ncp-btn-save:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(76,158,235,0.4); }
        .ncp-btn-saving { opacity: 0.7; }

        /* ═══ MOBILE ═══ */
        @media (max-width: 768px) {
          .ncp-panel { width: 100% !important; border-left: none; }
          .ncp-overlay { backdrop-filter: none; -webkit-backdrop-filter: none; }

          .ncp-header { padding: 12px 16px; padding-top: max(12px, env(safe-area-inset-top, 12px)); }
          .ncp-header-desktop { display: none; }
          .ncp-header-mobile { display: flex; align-items: center; gap: 12px; flex: 1; }

          .ncp-body { padding: 16px 16px 120px; }

          /* Stack 2-col rows */
          .ncp-row-2col { grid-template-columns: 1fr; gap: 14px; }

          .ncp-textarea { min-height: 80px; }

          /* Footer: fixed bottom */
          .ncp-footer {
            position: fixed; bottom: 0; left: 0; right: 0; z-index: 310;
            background: var(--bg-sidebar); padding: 12px 16px;
            padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
          }
          .ncp-footer-spacer { display: none; }
          .ncp-footer-btns { width: 100%; display: flex; gap: 10px; }
          .ncp-btn-cancel { flex: 1; justify-content: center; padding: 14px 12px; min-height: 48px; font-size: 14px; }
          .ncp-btn-save { flex: 1.3; justify-content: center; padding: 14px 12px; min-height: 48px; font-size: 14px; }
        }

        @media (max-width: 390px) {
          .ncp-body { padding: 14px 14px 120px; }
          .ncp-footer { padding: 10px 14px; padding-bottom: max(10px, env(safe-area-inset-bottom, 10px)); }
        }
      `}</style>
    </>
  );
}

function FormSectionHead({ icon, label }: { icon: string; label: string }) {
  const iconPaths: Record<string, React.ReactNode> = {
    building: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPaths[icon]}</svg>{label}
    </div>
  );
}