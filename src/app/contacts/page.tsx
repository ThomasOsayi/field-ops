'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { CompanyRecord } from '@/types/contact';
import { Job } from '@/types/job';
import { onCompaniesSnapshot, deleteCompany, createCompany } from '@/lib/contacts';
import { onJobsSnapshot } from '@/lib/jobs';
import { useFirestore } from '@/hooks/useFirestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ContactDetailPanel from '@/components/ContactDetailPanel';
import NewContactPanel from '@/components/NewContactPanel';
import ProtectedRoute from '@/components/ProtectedRoute';

const contactAvatarColors = ['var(--accent)', 'var(--purple)', 'var(--success)', 'var(--orange)', 'var(--warning)'];
function contactAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return contactAvatarColors[Math.abs(hash) % contactAvatarColors.length];
}
function contactInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function extractCity(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const secondLast = parts.length >= 3 ? parts[parts.length - 2] : '';
    const stateMatch = lastPart.match(/([A-Z]{2})/);
    if (stateMatch) {
      const state = stateMatch[1];
      if (secondLast && !secondLast.match(/^\d/)) return `${secondLast}, ${state}`;
      const beforeState = lastPart.replace(/\s*[A-Z]{2}\s*\d*/, '').trim();
      if (beforeState) return `${beforeState}, ${state}`;
      return state;
    }
    return parts.slice(-2).join(', ');
  }
  return address;
}

async function backfillCompaniesFromJobs(jobs: Job[]): Promise<number> {
  const grouped: Record<string, Job[]> = {};
  jobs.forEach(j => {
    if (!j.company?.trim()) return;
    const key = j.company.trim();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(j);
  });
  let created = 0;
  for (const [companyName, companyJobs] of Object.entries(grouped)) {
    const q = query(collection(db, 'companies'), where('name', '==', companyName));
    const snap = await getDocs(q);
    if (!snap.empty) continue;
    const sorted = companyJobs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const latest = sorted[0];
    const contactMap = new Map<string, { name: string; phone: string }>();
    companyJobs.forEach(j => {
      if (j.contactName?.trim()) {
        contactMap.set(j.contactName.trim().toLowerCase(), { name: j.contactName.trim(), phone: j.contactPhone?.trim() || '' });
      }
    });
    const contacts = Array.from(contactMap.values()).map((c, i) => ({ name: c.name, role: '', phone: c.phone, email: '', isPrimary: i === 0 }));
    await createCompany({ name: companyName, address: latest.address?.trim() || '', city: extractCity(latest.address || ''), contacts, notes: '', jobCount: companyJobs.length, lastJobDate: sorted[0].date || '' });
    created++;
  }
  return created;
}

export default function ContactsPage() {
  const { data: companies, loading: companiesLoading } = useFirestore<CompanyRecord>(onCompaniesSnapshot, []);
  const { data: jobs } = useFirestore<Job>(onJobsSnapshot, []);
  const loading = companiesLoading;
  const [filter, setFilter] = useState('All');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const autoBackfillRan = useRef(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetailOpen(false); setFormOpen(false); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (autoBackfillRan.current) return;
    if (companiesLoading) return;
    if (companies.length === 0 && jobs.length > 0) {
      autoBackfillRan.current = true;
      setSyncing(true);
      backfillCompaniesFromJobs(jobs).then(count => {
        setSyncing(false);
        if (count > 0) setSyncResult(`Auto-imported ${count} companies from your jobs`);
        setTimeout(() => setSyncResult(null), 4000);
      }).catch(() => setSyncing(false));
    }
  }, [companies, jobs, companiesLoading]);

  const handleSyncFromJobs = async () => {
    setSyncing(true); setSyncResult(null);
    const count = await backfillCompaniesFromJobs(jobs);
    setSyncing(false);
    setSyncResult(count > 0 ? `Imported ${count} new companies` : 'All companies already synced');
    setTimeout(() => setSyncResult(null), 4000);
  };

  const handleExport = () => {
    const headers = ['Company', 'Address', 'City', 'Contact Name', 'Phone', 'Email', 'Role', 'Jobs', 'Last Job'];
    const rows = filtered.map(c => {
      const primary = c.contacts?.find(ct => ct.isPrimary) ?? c.contacts?.[0];
      return [c.name, c.address, c.city, primary?.name || '', primary?.phone || '', primary?.email || '', primary?.role || '', String(getJobCount(c.name)), getLastJobDate(c.name)];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldops-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const companyJobStats = useMemo(() => {
    const map: Record<string, { count: number; lastDate: string }> = {};
    jobs.forEach(j => {
      const key = j.company.toLowerCase().trim();
      if (!map[key]) map[key] = { count: 0, lastDate: '' };
      map[key].count++;
      if (j.date > map[key].lastDate) map[key].lastDate = j.date;
    });
    return map;
  }, [jobs]);

  const getJobCount = (name: string) => companyJobStats[name.toLowerCase().trim()]?.count || 0;
  const getLastJobDate = (name: string) => companyJobStats[name.toLowerCase().trim()]?.lastDate || '';

  const cities = useMemo(() => {
    const set = new Set(companies.map(c => c.city).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [companies]);

  const filtered = useMemo(() => {
    let result = filter === 'All' ? companies : companies.filter(c => c.city === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q) ||
        c.contacts?.some(ct => ct.name.toLowerCase().includes(q) || ct.phone?.includes(q) || ct.email?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [companies, filter, searchQuery]);

  const totalContacts = companies.reduce((acc, c) => acc + (c.contacts?.length || 0), 0);

  const activeThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const active = new Set<string>();
    jobs.forEach(j => { const [y, m, d] = j.date.split('-').map(Number); if (new Date(y, m - 1, d) >= weekAgo) active.add(j.company.toLowerCase().trim()); });
    return companies.filter(c => active.has(c.name.toLowerCase().trim())).length;
  }, [companies, jobs]);

  const handleRowClick = (c: CompanyRecord) => { setSelectedCompany(c); setDetailOpen(true); setFormOpen(false); };
  const handleAddContact = () => { setEditingCompany(null); setFormOpen(true); setDetailOpen(false); };
  const handleEditCompany = (c: CompanyRecord) => { setEditingCompany(c); setFormOpen(true); setDetailOpen(false); };
  const handleDeleteCompany = async (c: CompanyRecord) => { if (!confirm(`Delete ${c.name}?`)) return; await deleteCompany(c.id); setDetailOpen(false); };

  const formatDate = (d: string) => {
    if (!d) return '—';
    try { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
  };

  const formatDateShort = (d: string) => {
    if (!d) return '—';
    try { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return d; }
  };

  return (
    <ProtectedRoute>
      <div className="ct-page">
        <Sidebar />
        <div className="ct-main app-main">
          <Topbar onNewJob={handleAddContact} onSearch={setSearchQuery} onExport={handleExport} buttonLabel="Add Contact" />
          <main className="ct-content">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
            ) : (<>
              {syncResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', marginBottom: '16px', background: 'var(--success-muted)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>
                  {syncResult}
                </div>
              )}

              {/* ── Stats ── */}
              <div className="ct-stats-grid">
                <CStatCard color="blue" label="Total Contacts" value={totalContacts} delta={`${companies.length} companies`} icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />
                <CStatCard color="purple" label="Companies" value={companies.length} delta={`Across ${Math.max(cities.length - 1, 0)} cities`} icon={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></>} />
                <CStatCard color="green" label="Active This Week" value={activeThisWeek} delta={`${activeThisWeek} with recent jobs`} icon={<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>} />
              </div>

              {/* ── Toolbar ── */}
              <div className="ct-toolbar">
                <div className="ct-toolbar-left">
                  <div className="ct-toolbar-title">All Companies & Contacts</div>
                  {jobs.length > 0 && (
                    <button onClick={handleSyncFromJobs} disabled={syncing} className="ct-sync-btn"
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px', animation: syncing ? 'spin 0.8s linear infinite' : 'none' }}>
                        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                      {syncing ? 'Syncing…' : 'Sync from Jobs'}
                    </button>
                  )}
                </div>
                <div className="ct-filters">
                  {cities.map(c => {
                    const isActive = filter === c;
                    const count = c === 'All' ? companies.length : companies.filter(co => co.city === c).length;
                    return (
                      <button key={c} onClick={() => setFilter(c)} className={`ct-pill ${isActive ? 'ct-pill-active' : ''}`}>
                        {c === 'All' ? 'All' : c.split(',')[0]}<span className="ct-pill-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Desktop Table ── */}
              <div className="ct-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['Company', 'Primary Contact', 'Phone', 'Jobs', 'Last Job', 'City', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr></thead>
                  <tbody>
                    {filtered.map(company => {
                      const primary = company.contacts?.find(c => c.isPrimary) ?? company.contacts?.[0];
                      const color = contactAvatarColor(company.name);
                      const initials = contactInitials(company.name);
                      const jobCount = getJobCount(company.name);
                      const lastJob = getLastJobDate(company.name);
                      const jcStyle = jobCount >= 6 ? { bg: 'var(--accent-glow)', color: 'var(--accent)' } : jobCount >= 3 ? { bg: 'var(--warning-muted)', color: 'var(--warning)' } : jobCount > 0 ? { bg: 'var(--success-muted)', color: 'var(--success)' } : { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' };
                      return (
                        <tr key={company.id} onClick={() => handleRowClick(company)} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => { (td as HTMLTableCellElement).style.background = 'var(--bg-hover)'; })}
                          onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => { (td as HTMLTableCellElement).style.background = ''; })}>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0 }}>{initials}</div>
                              <div><div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{company.name}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{company.address}</div></div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}><div style={{ fontWeight: 600, fontSize: '13px' }}>{primary?.name ?? '—'}</div></td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}><a href={primary?.phone ? `tel:${primary.phone.replace(/\D/g, '')}` : undefined} onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--mono)', textDecoration: 'none' }}>{primary?.phone ?? '—'}</a></td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}><span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--mono)', background: jcStyle.bg, color: jcStyle.color }}>{jobCount}</span></td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{formatDate(lastJob)}</span></td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{company.city}</span></td>
                          <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={e => { e.stopPropagation(); handleEditCompany(company); }} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteCompany(company); }} style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: '40px 18px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                      {companies.length === 0 && !syncing ? (
                        <div>
                          <p style={{ fontWeight: 600, marginBottom: '8px' }}>No companies yet</p>
                          <p style={{ fontSize: '12px', marginBottom: '12px' }}>{jobs.length > 0 ? 'Click "Sync from Jobs" to import companies from your existing jobs' : 'Add your first company to get started'}</p>
                          <button onClick={jobs.length > 0 ? handleSyncFromJobs : handleAddContact} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>
                            {jobs.length > 0 ? 'Sync from Jobs' : 'Add Company'}
                          </button>
                        </div>
                      ) : syncing ? 'Importing companies…' : 'No companies in this city.'}
                    </td></tr>}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Card List ── */}
              <div className="ct-cards">
                {filtered.map(company => {
                  const primary = company.contacts?.find(c => c.isPrimary) ?? company.contacts?.[0];
                  const color = contactAvatarColor(company.name);
                  const initials = contactInitials(company.name);
                  const jobCount = getJobCount(company.name);
                  const lastJob = getLastJobDate(company.name);
                  const shortContact = primary?.name
                    ? (primary.name.length > 16 ? primary.name.split(' ')[0] + ' ' + (primary.name.split(' ')[1]?.[0] || '') + '.' : primary.name)
                    : '—';
                  return (
                    <div key={company.id} className="ct-card" onClick={() => handleRowClick(company)}>
                      <div className="ct-card-avatar" style={{ background: color }}>{initials}</div>
                      <div className="ct-card-body">
                        <div className="ct-card-name">{company.name}</div>
                        <div className="ct-card-addr">{company.address}</div>
                        <div className="ct-card-contact">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          <span className="ct-card-cname">{shortContact}</span>
                          {primary?.phone && (
                            <a href={`tel:${primary.phone.replace(/\D/g, '')}`} onClick={e => e.stopPropagation()} className="ct-card-phone">{primary.phone}</a>
                          )}
                        </div>
                        <div className="ct-card-meta">
                          <span className="ct-card-jbadge">{jobCount} job{jobCount !== 1 ? 's' : ''}</span>
                          <div className="ct-card-meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>{formatDateShort(lastJob)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ct-card-chevron">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                    {companies.length === 0 ? 'No companies yet' : 'No companies match this filter.'}
                  </div>
                )}
              </div>
            </>)}
          </main>
        </div>
        <ContactDetailPanel open={detailOpen} company={selectedCompany} jobs={jobs} onClose={() => setDetailOpen(false)} onEdit={handleEditCompany} onDelete={handleDeleteCompany} onNewJob={() => {}} />
        <NewContactPanel open={formOpen} editingCompany={editingCompany} onClose={() => setFormOpen(false)} onSaved={() => {}} />
      </div>

      <style>{`
        .ct-page { display: flex; min-height: 100vh; background: var(--bg-void); }
        .ct-main { margin-left: var(--sidebar-width); flex: 1; display: flex; flex-direction: column; min-height: 100vh; min-width: 0; overflow: hidden; }
        .ct-content { padding: 28px 32px; flex: 1; }

        /* Stats */
        .ct-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }

        /* Toolbar */
        .ct-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .ct-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .ct-toolbar-title { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
        .ct-sync-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; border: 1px solid var(--border); color: var(--text-muted); font-family: var(--font); transition: all 0.15s; }
        .ct-filters { display: flex; gap: 6px; }
        .ct-pill { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font); transition: all 0.15s; background: transparent; border: 1px solid var(--border); color: var(--text-secondary); white-space: nowrap; }
        .ct-pill-active { background: var(--accent-glow-strong); border-color: rgba(76,158,235,0.3); color: var(--accent-bright); }
        .ct-pill-count { font-family: var(--mono); font-size: 10px; font-weight: 700; opacity: 0.6; }

        /* Desktop table */
        .ct-table-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }

        /* Mobile cards — hidden on desktop */
        .ct-cards { display: none; }

        /* ═══ MOBILE ═══ */
        @media (max-width: 768px) {
          .ct-main { margin-left: 0; }
          .ct-content { padding: 16px; padding-bottom: calc(var(--tabbar-height) + 16px); }

          /* Stats: horizontal scroll */
          .ct-stats-grid {
            display: flex; gap: 10px; margin-bottom: 16px;
            overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none;
          }
          .ct-stats-grid::-webkit-scrollbar { display: none; }
          .ct-stats-grid > div { flex-shrink: 0; width: 145px; }

          /* Toolbar: stack */
          .ct-toolbar { flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
          .ct-toolbar-title { font-size: 15px; }
          .ct-filters {
            width: 100%; overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none; padding-bottom: 2px;
          }
          .ct-filters::-webkit-scrollbar { display: none; }
          .ct-pill { flex-shrink: 0; }

          /* Hide table, show cards */
          .ct-table-wrap { display: none; }
          .ct-cards { display: flex; flex-direction: column; gap: 10px; }

          .ct-card {
            background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
            padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;
            cursor: pointer; -webkit-tap-highlight-color: transparent;
          }
          .ct-card:active { background: var(--bg-hover); }

          .ct-card-avatar {
            width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center;
            justify-content: center; font-weight: 800; font-size: 13px; color: #fff; flex-shrink: 0;
          }

          .ct-card-body { flex: 1; min-width: 0; }
          .ct-card-name { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
          .ct-card-addr { font-size: 11px; color: var(--text-muted); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .ct-card-contact { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
          .ct-card-contact svg { width: 12px; height: 12px; color: var(--text-muted); flex-shrink: 0; }
          .ct-card-cname { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
          .ct-card-phone { font-size: 11px; font-family: var(--mono); color: var(--accent); text-decoration: none; }

          .ct-card-meta { display: flex; align-items: center; gap: 12px; }
          .ct-card-jbadge { background: var(--accent-glow); color: var(--accent); padding: 1px 7px; border-radius: 8px; font-family: var(--mono); font-size: 10px; font-weight: 700; }
          .ct-card-meta-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
          .ct-card-meta-item svg { width: 12px; height: 12px; }
          .ct-card-meta-item span { font-family: var(--mono); font-weight: 600; }

          .ct-card-chevron { color: var(--text-muted); flex-shrink: 0; align-self: center; }
          .ct-card-chevron svg { width: 16px; height: 16px; }
        }

        @media (max-width: 390px) {
          .ct-content { padding: 12px; padding-bottom: calc(var(--tabbar-height) + 12px); }
          .ct-card { padding: 12px 14px; }
          .ct-card-name { font-size: 14px; }
          .ct-stats-grid > div { width: 130px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </ProtectedRoute>
  );
}

function CStatCard({ color, label, value, delta, icon }: { color: 'blue' | 'purple' | 'green'; label: string; value: number; delta: string; icon: React.ReactNode }): React.ReactNode {
  const cm = { blue: { t: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', ib: 'var(--accent-glow)', ic: 'var(--accent)', vc: 'var(--text-primary)' }, purple: { t: 'var(--purple)', ib: 'var(--purple-muted)', ic: 'var(--purple)', vc: 'var(--purple)' }, green: { t: 'var(--success)', ib: 'var(--success-muted)', ic: 'var(--success)', vc: 'var(--success)' } };
  const c = cm[color];
  return (
    <div className="ct-stat-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.t }} />
      <div className="ct-stat-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div className="ct-stat-icon" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.ib, color: c.ic }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{icon}</svg></div>
        <div className="ct-stat-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <div className="ct-stat-val" style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: c.vc, marginBottom: '4px' }}>{value}</div>
      <div className="ct-stat-delta" style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-muted)' }}>{delta}</div>
    </div>
  );
}