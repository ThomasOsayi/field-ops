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
      setCompanyName(editingCompany.name);
      setCity(editingCompany.city);
      setAddress(editingCompany.address);
      setNotes(editingCompany.notes);
      const primary = editingCompany.contacts.find((c) => c.isPrimary) ?? editingCompany.contacts[0];
      if (primary) {
        setContactName(primary.name);
        setContactRole(primary.role);
        setContactPhone(primary.phone);
        setContactEmail(primary.email);
      }
    } else {
      setCompanyName(''); setCity(''); setAddress('');
      setContactName(''); setContactRole(''); setContactPhone(''); setContactEmail('');
      setNotes('');
    }
  }, [editingCompany, open]);

  const handleSave = async () => {
    if (!companyName.trim()) return;
    setSaving(true);
    try {
      const data: NewCompanyRecord = {
        name: companyName.trim(),
        address: address.trim(),
        city: city.trim(),
        contacts: [{
          name: contactName.trim(),
          role: contactRole.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          isPrimary: true,
        }],
        notes: notes.trim(),
        jobCount: editingCompany?.jobCount ?? 0,
        lastJobDate: editingCompany?.lastJobDate ?? '',
      };

      if (isEditing) {
        await updateCompany(editingCompany.id, data);
      } else {
        await createCompany(data);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save contact:', err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '11px 14px',
    fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)',
    outline: 'none', width: '100%', transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
  };

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
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>{isEditing ? 'Edit Contact' : 'Add Contact'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isEditing ? 'Update company & contact info' : 'New company & contact info'}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', transition: 'all 0.15s' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          {/* Company Section */}
          <div style={{ marginBottom: '28px' }}>
            <ContactFormSectionHead icon="building" label="Company" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Company Name</label>
                <input type="text" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>City</label>
                <input type="text" placeholder="City, State" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Address</label>
              <input type="text" placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Contact Person Section */}
          <div style={{ marginBottom: '28px' }}>
            <ContactFormSectionHead icon="user" label="Contact Person" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Full Name</label>
                <input type="text" placeholder="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Role</label>
                <input type="text" placeholder="e.g. Site Manager" value={contactRole} onChange={(e) => setContactRole(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Phone</label>
                <input type="tel" placeholder="(000) 000-0000" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={{ ...inputStyle, fontFamily: 'var(--mono)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" placeholder="email@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <ContactFormSectionHead icon="edit" label="Notes" />
            <textarea
              placeholder="Gate codes, access info, parking, preferred hours…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '90px', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)', transition: 'all 0.15s', opacity: saving ? 0.7 : 1 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Contact'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Helper ── */

function ContactFormSectionHead({ icon, label }: { icon: string; label: string }): React.ReactNode {
  const iconPaths: Record<string, React.ReactNode> = {
    building: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPaths[icon]}</svg>
      {label}
    </div>
  );
}