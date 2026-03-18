'use client';

import { useEffect, useState, useMemo } from 'react';
import { CompanyRecord } from '@/types/contact';
import { Job } from '@/types/job';
import { onCompaniesSnapshot, deleteCompany } from '@/lib/contacts';
import { onJobsSnapshot } from '@/lib/jobs';
import { useFirestore } from '@/hooks/useFirestore';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ContactDetailPanel from '@/components/ContactDetailPanel';
import NewContactPanel from '@/components/NewContactPanel';

/* ── Seed data ── */
const SEED_COMPANIES: CompanyRecord[] = [
  {
    id: 'c1', name: 'Meridian Controls', address: '4521 Industrial Blvd', city: 'Houston, TX',
    contacts: [
      { name: 'Mike Torres', role: 'Site Manager', phone: '(832) 555-0147', email: 'mike@meridian.com', isPrimary: true },
      { name: 'Rachel Johnson', role: 'Building Manager', phone: '(832) 555-0201', email: 'rachel@meridian.com', isPrimary: false },
    ],
    notes: 'Gate code: 4829#. Preferred parking in loading bay B. Mike available 7 AM – 4 PM. After hours, contact Rachel.',
    jobCount: 8, lastJobDate: '2026-03-18', createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'c2', name: 'Atlas Data Centers', address: '880 Server Way', city: 'Dallas, TX',
    contacts: [{ name: 'Sarah Kim', role: 'Facility Director', phone: '(469) 555-0283', email: 'skim@atlasdc.com', isPrimary: true }],
    notes: '', jobCount: 6, lastJobDate: '2026-03-18', createdAt: '2026-01-20T00:00:00.000Z',
  },
  {
    id: 'c3', name: 'Pinnacle Logistics', address: '1200 Commerce Dr', city: 'Fort Worth, TX',
    contacts: [{ name: 'James Okafor', role: 'Ops Manager', phone: '(817) 555-0391', email: 'jokafor@pinnacle.com', isPrimary: true }],
    notes: '', jobCount: 4, lastJobDate: '2026-03-17', createdAt: '2026-02-05T00:00:00.000Z',
  },
  {
    id: 'c4', name: 'CrossPoint Electric', address: '760 Kirby Dr', city: 'Houston, TX',
    contacts: [{ name: 'Dev Patel', role: 'Chief Engineer', phone: '(713) 555-0512', email: 'dev@crosspoint.com', isPrimary: true }],
    notes: '', jobCount: 2, lastJobDate: '2026-03-19', createdAt: '2026-02-15T00:00:00.000Z',
  },
  {
    id: 'c5', name: 'Zenith Mechanical', address: '3300 Westheimer Rd', city: 'Houston, TX',
    contacts: [{ name: 'Laura Chen', role: 'Project Lead', phone: '(281) 555-0688', email: 'lchen@zenith.com', isPrimary: true }],
    notes: '', jobCount: 3, lastJobDate: '2026-03-20', createdAt: '2026-03-01T00:00:00.000Z',
  },
];

const contactAvatarColors = ['var(--accent)', 'var(--purple)', 'var(--success)', 'var(--orange)', 'var(--warning)'];
function contactAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return contactAvatarColors[Math.abs(hash) % contactAvatarColors.length];
}
function contactInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ContactsPage() {
  const { data: companies, loading: companiesLoading } = useFirestore<CompanyRecord>(onCompaniesSnapshot, SEED_COMPANIES);
  const { data: jobs } = useFirestore<Job>(onJobsSnapshot, []);
  const loading = companiesLoading;
  const [filter, setFilter] = useState('All');

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDetailOpen(false); setFormOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const cities = useMemo(() => {
    const set = new Set(companies.map((c) => c.city));
    return ['All', ...Array.from(set)];
  }, [companies]);

  const filtered = useMemo(() => {
    if (filter === 'All') return companies;
    return companies.filter((c) => c.city === filter);
  }, [companies, filter]);

  const totalContacts = companies.reduce((acc, c) => acc + c.contacts.length, 0);
  const activeThisWeek = companies.filter((c) => {
    if (!c.lastJobDate) return false;
    const d = new Date(c.lastJobDate);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  }).length;

  const handleRowClick = (company: CompanyRecord) => { setSelectedCompany(company); setDetailOpen(true); setFormOpen(false); };
  const handleAddContact = () => { setEditingCompany(null); setFormOpen(true); setDetailOpen(false); };
  const handleEditCompany = (company: CompanyRecord) => { setEditingCompany(company); setFormOpen(true); setDetailOpen(false); };
  const handleDeleteCompany = async (company: CompanyRecord) => {
    if (!confirm(`Delete ${company.name}?`)) return;
    await deleteCompany(company.id);
    setDetailOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
        <Topbar onNewJob={handleAddContact} />
        <main style={{ padding: '28px 32px', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
                <ContactStatCard color="blue" label="Total Contacts" value={totalContacts} delta={`${companies.length} companies`} />
                <ContactStatCard color="purple" label="Companies" value={companies.length} delta={`Across ${cities.length - 1} cities`} />
                <ContactStatCard color="green" label="Active This Week" value={activeThisWeek} delta="Jobs scheduled" />
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>All Companies & Contacts</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {cities.map((c) => {
                    const isActive = filter === c;
                    const count = c === 'All' ? companies.length : companies.filter((co) => co.city === c).length;
                    return (
                      <button key={c} onClick={() => setFilter(c)} style={{
                        display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
                        background: isActive ? 'var(--accent-glow-strong)' : 'transparent',
                        border: isActive ? '1px solid rgba(76,158,235,0.3)' : '1px solid var(--border)',
                        color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                      }}>
                        {c === 'All' ? 'All' : c.split(',')[0]}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, opacity: 0.6 }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Table */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Company', 'Primary Contact', 'Phone', 'Jobs', 'Last Job', 'City', ''].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((company) => {
                      const primary = company.contacts.find((c) => c.isPrimary) ?? company.contacts[0];
                      const color = contactAvatarColor(company.name);
                      const initials = contactInitials(company.name);
                      const jcStyle = company.jobCount >= 6 ? { bg: 'var(--accent-glow)', color: 'var(--accent)' }
                        : company.jobCount >= 4 ? { bg: 'var(--warning-muted)', color: 'var(--warning)' }
                        : { bg: 'var(--success-muted)', color: 'var(--success)' };

                      return (
                        <tr key={company.id} onClick={() => handleRowClick(company)} className="group" style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={(e) => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((td) => { (td as HTMLTableCellElement).style.background = 'var(--bg-hover)'; }); }}
                          onMouseLeave={(e) => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((td) => { (td as HTMLTableCellElement).style.background = ''; }); }}
                        >
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{company.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{company.address}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{primary?.name ?? '—'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{primary?.role ?? ''}</div>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{primary?.phone ?? '—'}</span>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--mono)', background: jcStyle.bg, color: jcStyle.color }}>{company.jobCount}</span>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                              {company.lastJobDate ? new Date(company.lastJobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{company.city}</span>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div className="opacity-0 group-hover:opacity-100" style={{ display: 'flex', gap: '4px', transition: 'opacity 0.15s' }}>
                              <button onClick={(e) => { e.stopPropagation(); handleEditCompany(company); }}
                                style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button onClick={(e) => e.stopPropagation()}
                                style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: '40px 18px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>No companies found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      <ContactDetailPanel open={detailOpen} company={selectedCompany} jobs={jobs} onClose={() => setDetailOpen(false)} onEdit={handleEditCompany} onDelete={handleDeleteCompany} onNewJob={() => {}} />
      <NewContactPanel open={formOpen} editingCompany={editingCompany} onClose={() => setFormOpen(false)} onSaved={() => {}} />
    </div>
  );
}

/* ── Stat Card (unique name) ── */
function ContactStatCard({ color, label, value, delta }: { color: 'blue' | 'purple' | 'green'; label: string; value: number; delta: string }): React.ReactNode {
  const colorMap = {
    blue: { topColor: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', iconBg: 'var(--accent-glow)', iconColor: 'var(--accent)', valColor: 'var(--text-primary)' },
    purple: { topColor: 'var(--purple)', iconBg: 'var(--purple-muted)', iconColor: 'var(--purple)', valColor: 'var(--purple)' },
    green: { topColor: 'var(--success)', iconBg: 'var(--success-muted)', iconColor: 'var(--success)', valColor: 'var(--success)' },
  };
  const c = colorMap[color];
  const icons: Record<string, React.ReactNode> = {
    blue: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    purple: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></>,
    green: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.topColor }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.iconBg, color: c.iconColor }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{icons[color]}</svg>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: c.valColor, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-muted)' }}>{delta}</div>
    </div>
  );
}