'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Job } from '@/types/job';
import { getJobs } from '@/lib/jobs';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

/* ── File type config ── */
interface DocFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'archive' | 'checklist' | 'doc';
  jobNumber: string;
  company: string;
  date: string;
}

const typeConfig: Record<string, { label: string; iconBg: string; iconColor: string; previewBg: string; badgeBg: string; badgeColor: string }> = {
  pdf: { label: 'PDF', iconBg: 'var(--danger-muted)', iconColor: 'var(--danger)', previewBg: 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.03))', badgeBg: 'var(--danger-muted)', badgeColor: 'var(--danger)' },
  image: { label: 'Photo', iconBg: 'var(--accent-glow)', iconColor: 'var(--accent)', previewBg: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(76,158,235,0.03))', badgeBg: 'var(--accent-glow)', badgeColor: 'var(--accent)' },
  archive: { label: 'Archive', iconBg: 'var(--purple-muted)', iconColor: 'var(--purple)', previewBg: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(167,139,250,0.03))', badgeBg: 'var(--purple-muted)', badgeColor: 'var(--purple)' },
  checklist: { label: 'Checklist', iconBg: 'var(--orange-muted)', iconColor: 'var(--orange)', previewBg: 'linear-gradient(135deg, rgba(251,146,60,0.08), rgba(251,146,60,0.03))', badgeBg: 'var(--orange-muted)', badgeColor: 'var(--orange)' },
  doc: { label: 'Document', iconBg: 'var(--success-muted)', iconColor: 'var(--success)', previewBg: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.03))', badgeBg: 'var(--success-muted)', badgeColor: 'var(--success)' },
};

const fileTypeIcon = (type: string) => {
  if (type === 'image') return <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>;
  if (type === 'archive') return <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/></>;
  if (type === 'checklist') return <polyline points="20 6 9 17 4 12"/>;
  return <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>;
};

/* ── Seed files ── */
const SEED_FILES: DocFile[] = [
  { id: 'f1', name: 'MOP-2401.pdf', size: '1.2 MB', type: 'pdf', jobNumber: 'JOB-2401', company: 'Meridian Controls', date: '2026-03-18' },
  { id: 'f2', name: 'checklist-hvac.pdf', size: '340 KB', type: 'checklist', jobNumber: 'JOB-2401', company: 'Meridian Controls', date: '2026-03-18' },
  { id: 'f3', name: 'site-photos.zip', size: '8.4 MB', type: 'archive', jobNumber: 'JOB-2401', company: 'Meridian Controls', date: '2026-03-18' },
  { id: 'f4', name: 'thermal-report.pdf', size: '2.1 MB', type: 'pdf', jobNumber: 'JOB-2400', company: 'Atlas Data Centers', date: '2026-03-18' },
  { id: 'f5', name: 'battery-specs.pdf', size: '800 KB', type: 'pdf', jobNumber: 'JOB-2400', company: 'Atlas Data Centers', date: '2026-03-17' },
  { id: 'f6', name: 'ups-diagram.pdf', size: '1.5 MB', type: 'pdf', jobNumber: 'JOB-2400', company: 'Atlas Data Centers', date: '2026-03-17' },
  { id: 'f7', name: 'site-access.pdf', size: '200 KB', type: 'pdf', jobNumber: 'JOB-2400', company: 'Atlas Data Centers', date: '2026-03-16' },
  { id: 'f8', name: 'photos.zip', size: '12 MB', type: 'archive', jobNumber: 'JOB-2400', company: 'Atlas Data Centers', date: '2026-03-16' },
  { id: 'f9', name: 'inspection-cert.pdf', size: '500 KB', type: 'pdf', jobNumber: 'JOB-2399', company: 'Pinnacle Logistics', date: '2026-03-17' },
  { id: 'f10', name: 'panel-wiring-photo.jpg', size: '3.2 MB', type: 'image', jobNumber: 'JOB-2399', company: 'Pinnacle Logistics', date: '2026-03-17' },
  { id: 'f11', name: 'before-photos.zip', size: '15 MB', type: 'image', jobNumber: 'JOB-2399', company: 'Pinnacle Logistics', date: '2026-03-16' },
  { id: 'f12', name: 'gen-specs.pdf', size: '2.5 MB', type: 'pdf', jobNumber: 'JOB-2398', company: 'CrossPoint Electric', date: '2026-03-15' },
];

const filters: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'PDFs', value: 'pdf' },
  { label: 'Photos', value: 'image' },
  { label: 'Archives', value: 'archive' },
  { label: 'Checklists', value: 'checklist' },
];

export default function DocumentsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [files] = useState<DocFile[]>(SEED_FILES);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Panel state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<DocFile | null>(null);

  const fetchJobs = useCallback(async () => {
    try { const data = await getJobs(); setJobs(data); } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setUploadOpen(false); setPreviewOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() =>
    filter === 'all' ? files : files.filter((f) => f.type === filter),
    [files, filter]);

  const countFor = (val: string) =>
    val === 'all' ? files.length : files.filter((f) => f.type === val).length;

  const totalPdfs = files.filter((f) => f.type === 'pdf').length;
  const totalPhotos = files.filter((f) => f.type === 'image').length;

  const openPreview = (file: DocFile) => {
    setPreviewFile(file);
    setPreviewOpen(true);
    setUploadOpen(false);
  };

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Sidebar />

      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
        <Topbar onNewJob={() => setUploadOpen(true)} />

        <main style={{ padding: '28px 32px', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
                <DocStatCard color="blue" label="Total Files" value={files.length} delta={`Across ${new Set(files.map(f => f.jobNumber)).size} jobs`} icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />
                <DocStatCard color="orange" label="PDFs" value={totalPdfs} delta="MOPs, permits, reports" icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />
                <DocStatCard color="purple" label="Photos" value={totalPhotos} delta="Site documentation" icon={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />
                <DocStatCard color="green" label="Storage" value={142} delta="MB used" icon={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />
              </div>

              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>All Documents</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {filters.map((f) => {
                      const isActive = filter === f.value;
                      return (
                        <button key={f.value} onClick={() => setFilter(f.value)} style={{
                          display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
                          background: isActive ? 'var(--accent-glow-strong)' : 'transparent',
                          border: isActive ? '1px solid rgba(76,158,235,0.3)' : '1px solid var(--border)',
                          color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                        }}>
                          {f.label}
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, opacity: 0.6 }}>{countFor(f.value)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* View toggle */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
                  {(['grid', 'list'] as const).map((v) => (
                    <button key={v} onClick={() => setView(v)} style={{
                      padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)', transition: 'all 0.15s',
                      background: view === v ? 'var(--accent-glow-strong)' : 'transparent',
                      color: view === v ? 'var(--accent-bright)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'capitalize',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                        {v === 'grid'
                          ? <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>
                          : <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}
                      </svg>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* ═══ GRID VIEW ═══ */}
              {view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                  {filtered.map((file) => {
                    const tc = typeConfig[file.type] ?? typeConfig.doc;
                    return (
                      <div
                        key={file.id}
                        onClick={() => openPreview(file)}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                      >
                        {/* Preview area */}
                        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: tc.previewBg }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '36px', height: '36px', opacity: 0.5, color: tc.iconColor }}>
                            {fileTypeIcon(file.type)}
                          </svg>
                          <span style={{ position: 'absolute', top: '10px', right: '10px', fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: tc.badgeBg, color: tc.badgeColor }}>
                            {tc.label}
                          </span>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: '8px' }}>{file.size}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: '4px' }}>{file.jobNumber}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{formatDate(file.date)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ═══ TABLE VIEW ═══ */
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['File', 'Type', 'Size', 'Linked Job', 'Date', ''].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((file) => {
                        const tc = typeConfig[file.type] ?? typeConfig.doc;
                        return (
                          <tr key={file.id} onClick={() => openPreview(file)} style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                            onMouseEnter={(e) => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((td) => { (td as HTMLTableCellElement).style.background = 'var(--bg-hover)'; }); }}
                            onMouseLeave={(e) => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((td) => { (td as HTMLTableCellElement).style.background = ''; }); }}
                          >
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: tc.iconBg, color: tc.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{fileTypeIcon(file.type)}</svg>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{file.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{file.company}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{tc.label}</span>
                            </td>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{file.size}</span>
                            </td>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px', fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, background: 'var(--accent-glow)', color: 'var(--accent)' }}>{file.jobNumber}</span>
                            </td>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{formatDate(file.date)}</span>
                            </td>
                            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                              <div style={{ color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: 'var(--radius-xs)', transition: 'all 0.15s' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filtered.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '40px 18px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>No documents found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ═══ UPLOAD PANEL ═══ */}
      {uploadOpen && (
        <>
          <div onClick={() => setUploadOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '580px', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>Upload Document</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Add files to FieldOps</div>
                </div>
              </div>
              <button onClick={() => setUploadOpen(false)} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              {/* Drop zone */}
              <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '24px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '12px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>Drop files here or click to browse</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PDF, JPG, PNG, ZIP — up to 25 MB each</div>
              </div>
              {/* Link to job */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Link to Job (optional)</div>
                <select style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 14px', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
                  <option value="">No job linked</option>
                  <option>JOB-2401 — Meridian Controls</option>
                  <option>JOB-2400 — Atlas Data Centers</option>
                  <option>JOB-2399 — Pinnacle Logistics</option>
                  <option>JOB-2398 — CrossPoint Electric</option>
                </select>
              </div>
              {/* Notes */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes</div>
                <textarea placeholder="Description or context for this file…" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 14px', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', width: '100%', resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} />
              </div>
            </div>
            <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
              <button onClick={() => setUploadOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Cancel</button>
              <button onClick={() => setUploadOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>
                Upload
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ PREVIEW PANEL ═══ */}
      {previewOpen && previewFile && (
        <>
          <div onClick={() => setPreviewOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '580px', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>File Preview</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Document details</div>
                </div>
              </div>
              <button onClick={() => setPreviewOpen(false)} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              {/* Hero */}
              <div style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (typeConfig[previewFile.type] ?? typeConfig.doc).iconBg, color: (typeConfig[previewFile.type] ?? typeConfig.doc).iconColor }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}>{fileTypeIcon(previewFile.type)}</svg>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>{previewFile.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{previewFile.size} · {(typeConfig[previewFile.type] ?? typeConfig.doc).label}</div>
              </div>
              {/* Details */}
              <div style={{ padding: '24px 28px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    File Details
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {[
                      { l: 'File Name', v: previewFile.name },
                      { l: 'Type', v: (typeConfig[previewFile.type] ?? typeConfig.doc).label },
                      { l: 'Size', v: previewFile.size, mono: true },
                      { l: 'Uploaded', v: formatDate(previewFile.date), mono: true, last: true },
                    ].map((r) => (
                      <div key={r.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: r.last ? 'none' : '1px solid var(--border)' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.l}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: r.mono ? 'var(--mono)' : undefined }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    Linked Job
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Job</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{previewFile.jobNumber}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Company</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{previewFile.company}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
              <button onClick={() => setPreviewOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Close</button>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Stat Card ── */
function DocStatCard({ color, label, value, delta, icon }: { color: 'blue' | 'orange' | 'purple' | 'green'; label: string; value: number; delta: string; icon: React.ReactNode }): React.ReactNode {
  const colorMap = {
    blue: { topColor: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', iconBg: 'var(--accent-glow)', iconColor: 'var(--accent)', valColor: 'var(--text-primary)' },
    orange: { topColor: 'var(--orange)', iconBg: 'var(--orange-muted)', iconColor: 'var(--orange)', valColor: 'var(--orange)' },
    purple: { topColor: 'var(--purple)', iconBg: 'var(--purple-muted)', iconColor: 'var(--purple)', valColor: 'var(--purple)' },
    green: { topColor: 'var(--success)', iconBg: 'var(--success-muted)', iconColor: 'var(--success)', valColor: 'var(--success)' },
  };
  const c = colorMap[color];
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.topColor }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.iconBg, color: c.iconColor }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{icon}</svg>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: c.valColor, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-muted)' }}>{delta}</div>
    </div>
  );
}