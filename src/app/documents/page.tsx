'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Job } from '@/types/job';
import { onJobsSnapshot } from '@/lib/jobs';
import { DocRecord, onDocumentsSnapshot, uploadDocument, getDocumentDownloadUrl } from '@/lib/documents';
import { notifyDocumentUploaded } from '@/lib/notifications';
import { useFirestore } from '@/hooks/useFirestore';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase';

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

const isViewable = (type: string, mimeType?: string) => type === 'pdf' || type === 'image' || (mimeType && (mimeType.startsWith('image/') || mimeType === 'application/pdf'));

const filters = [
  { label: 'All', value: 'all' }, { label: 'PDFs', value: 'pdf' }, { label: 'Photos', value: 'image' },
  { label: 'Archives', value: 'archive' }, { label: 'Checklists', value: 'checklist' },
];

export default function DocumentsPage() {
  const { data: docs } = useFirestore<DocRecord>(onDocumentsSnapshot, []);
  const { data: jobs } = useFirestore<Job>(onJobsSnapshot, []);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [linkedJob, setLinkedJob] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview panel
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);

  // Full-screen viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [viewerType, setViewerType] = useState<'pdf' | 'image' | 'none'>('none');
  const [viewerName, setViewerName] = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewerOpen) { setViewerOpen(false); return; }
        setUploadOpen(false); setPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [viewerOpen]);

  const filtered = useMemo(() => {
    let result = filter === 'all' ? docs : docs.filter(d => d.type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.jobNumber?.toLowerCase().includes(q) ||
        d.company?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [docs, filter, searchQuery]);
  const countFor = (v: string) => v === 'all' ? docs.length : docs.filter(d => d.type === v).length;
  const totalStorage = useMemo(() => Math.round(docs.reduce((a, d) => a + (d.sizeBytes || 0), 0) / (1024 * 1024)), [docs]);

  const formatDate = (d: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; }
  };

  // Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true); setUploadProgress(0);
    const linkedJobData = jobs.find(j => `${j.jobNumber} — ${j.company}` === linkedJob);
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      await new Promise<void>((resolve, reject) => {
        uploadDocument(file, { jobNumber: linkedJobData?.jobNumber || '', company: linkedJobData?.company || '', uploadedBy: 'Thomas Osayi' },
          (pct) => setUploadProgress(Math.round(((i + pct / 100) / selectedFiles.length) * 100)),
          (doc) => { notifyDocumentUploaded(doc.name, doc.jobNumber, 'Thomas Osayi').catch(() => {}); resolve(); },
          (err) => { console.error('Upload failed:', err); reject(err); }
        );
      });
    }
    setUploading(false); setUploadProgress(100);
    setTimeout(() => { setUploadOpen(false); setSelectedFiles([]); setLinkedJob(''); setUploadProgress(0); }, 800);
  };

  const resetUpload = () => { setUploadOpen(false); setSelectedFiles([]); setLinkedJob(''); setUploadProgress(0); setUploading(false); };

  const handleDownload = async (d: DocRecord) => {
    if (!d.storagePath && !d.storageUrl) return;
    try {
      const url = d.storageUrl || await getDocumentDownloadUrl(d.storagePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = d.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) { console.error('Download failed:', e); }
  };

  const handleLinkJob = async (docRecord: DocRecord, jobValue: string) => {
    const linkedJobData = jobs.find(j => `${j.jobNumber} — ${j.company}` === jobValue);
    const updates = {
      jobNumber: linkedJobData?.jobNumber || '',
      company: linkedJobData?.company || '',
    };
    await updateDoc(doc(db, 'documents', docRecord.id), updates);
    // Update local preview state
    setPreviewDoc({ ...docRecord, ...updates });
  };

  // Viewer
  const openViewer = async (d: DocRecord) => {
    const url = d.storageUrl || (d.storagePath ? await getDocumentDownloadUrl(d.storagePath) : '');
    if (!url) return;
    setViewerUrl(url);
    setViewerName(d.name);
    setViewerType(d.type === 'pdf' ? 'pdf' : d.type === 'image' ? 'image' : 'none');
    setViewerOpen(true);
  };

  // Thumbnail helper
  const getThumbnailUrl = (d: DocRecord) => {
    if (d.type === 'image' && d.storageUrl) return d.storageUrl;
    return null;
  };

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
        <Sidebar />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
          <Topbar onNewJob={() => setUploadOpen(true)} onSearch={setSearchQuery} buttonLabel="Upload File" />
          <main style={{ padding: '28px 32px', flex: 1 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
              <SC color="blue" label="Total Files" value={docs.length} delta={`Across ${new Set(docs.map(d => d.jobNumber).filter(Boolean)).size} jobs`} icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />
              <SC color="orange" label="PDFs" value={docs.filter(d => d.type === 'pdf').length} delta="MOPs, permits, reports" icon={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />
              <SC color="purple" label="Photos" value={docs.filter(d => d.type === 'image').length} delta="Site documentation" icon={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />
              <SC color="green" label="Storage" value={totalStorage} delta="MB used" icon={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />
            </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>All Documents</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {filters.map(f => { const a = filter === f.value; return (
                  <button key={f.value} onClick={() => setFilter(f.value)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s', background: a ? 'var(--accent-glow-strong)' : 'transparent', border: a ? '1px solid rgba(76,158,235,0.3)' : '1px solid var(--border)', color: a ? 'var(--accent-bright)' : 'var(--text-secondary)' }}>
                    {f.label}<span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, opacity: 0.6 }}>{countFor(f.value)}</span>
                  </button>); })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
              {(['grid', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)', transition: 'all 0.15s', background: view === v ? 'var(--accent-glow-strong)' : 'transparent', color: view === v ? 'var(--accent-bright)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'capitalize' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                    {v === 'grid' ? <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> : <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}
                  </svg>{v}
                </button>
              ))}
            </div>
          </div>

          {/* Empty */}
          {docs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>No documents yet</p>
              <button onClick={() => setUploadOpen(true)} style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 18px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>Upload Document</button>
            </div>
          )}

          {/* Grid */}
          {docs.length > 0 && view === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {filtered.map(file => { const tc = typeConfig[file.type] ?? typeConfig.doc; const thumb = getThumbnailUrl(file); return (
                <div key={file.id} onClick={() => { setPreviewDoc(file); setPreviewOpen(true); }}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border-hover)'; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.transform = ''; el.style.boxShadow = ''; }}>
                  {/* Preview area — real thumbnail for images */}
                  <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: thumb ? '#000' : tc.previewBg, overflow: 'hidden' }}>
                    {thumb ? (
                      <img src={thumb} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '36px', height: '36px', opacity: 0.5, color: tc.iconColor }}>{fileTypeIcon(file.type)}</svg>
                    )}
                    <span style={{ position: 'absolute', top: '10px', right: '10px', fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', background: tc.badgeBg, color: tc.badgeColor, backdropFilter: 'blur(4px)' }}>{tc.label}</span>
                    {/* View overlay on hover for viewable types */}
                    {isViewable(file.type, file.mimeType) && (
                      <div onClick={(e) => { e.stopPropagation(); openViewer(file); }}
                        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,8,12,0.6)', opacity: 0, transition: 'opacity 0.2s', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0'; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', background: 'rgba(76,158,235,0.2)', border: '1px solid rgba(76,158,235,0.3)', color: 'var(--accent-bright)', fontSize: '12px', fontWeight: 700 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          View
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginBottom: '8px' }}>{file.size}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {file.jobNumber && <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: '4px' }}>{file.jobNumber}</span>}
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ); })}
            </div>
          )}

          {/* Table */}
          {docs.length > 0 && view === 'list' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['File', 'Type', 'Size', 'Linked Job', 'Date', ''].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map(file => { const tc = typeConfig[file.type] ?? typeConfig.doc; return (
                    <tr key={file.id} onClick={() => { setPreviewDoc(file); setPreviewOpen(true); }} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => { (td as HTMLTableCellElement).style.background = 'var(--bg-hover)'; })}
                      onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => { (td as HTMLTableCellElement).style.background = ''; })}>
                      <td style={{ padding: '14px 18px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '38px', height: '38px', borderRadius: '8px', background: tc.iconBg, color: tc.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {file.type === 'image' && file.storageUrl ? <img src={file.storageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{fileTypeIcon(file.type)}</svg>}
                      </div><div><div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{file.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{file.company}</div></div></div></td>
                      <td style={{ padding: '14px 18px' }}><span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{tc.label}</span></td>
                      <td style={{ padding: '14px 18px' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{file.size}</span></td>
                      <td style={{ padding: '14px 18px' }}>{file.jobNumber && <span style={{ padding: '3px 10px', borderRadius: '6px', fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, background: 'var(--accent-glow)', color: 'var(--accent)' }}>{file.jobNumber}</span>}</td>
                      <td style={{ padding: '14px 18px' }}><span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{formatDate(file.createdAt)}</span></td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {isViewable(file.type, file.mimeType) && <div onClick={e => { e.stopPropagation(); openViewer(file); }} style={{ color: 'var(--accent)', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)', transition: 'background 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-glow)'; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </div>}
                          <div onClick={e => { e.stopPropagation(); handleDownload(file); }} style={{ color: 'var(--text-muted)', cursor: 'pointer', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-xs)', transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-glow)'; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </div>
                        </div>
                      </td>
                    </tr>); })}
                  {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '40px 18px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>No documents found.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          </main>
        </div>

      <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z,.doc,.docx" style={{ display: 'none' }} onChange={e => { if (e.target.files) setSelectedFiles(Array.from(e.target.files)); }} />

      {/* ═══ UPLOAD PANEL ═══ */}
      {uploadOpen && <>
        <div onClick={resetUpload} style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '580px', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
              <div><div style={{ fontSize: '17px', fontWeight: 800 }}>Upload Document</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Add files to FieldOps</div></div>
            </div>
            <button onClick={resetUpload} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
            <div onClick={() => fileInputRef.current?.click()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) setSelectedFiles(Array.from(e.dataTransfer.files)); }} onDragOver={e => e.preventDefault()}
              style={{ border: '2px solid var(--border)', borderRadius: 'var(--radius)', padding: '48px 32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '24px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-glow)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '12px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 600 }}>Drop files here or click to browse</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PDF, JPG, PNG, ZIP — up to 25 MB each</div>
            </div>
            {selectedFiles.length > 0 && <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Selected ({selectedFiles.length})</div>
              {selectedFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '6px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', color: 'var(--accent)', flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontSize: '12px', fontWeight: 600, flex: 1 }}>{f.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setSelectedFiles(p => p.filter((_, idx) => idx !== i)); }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </div>))}
            </div>}
            {uploading && <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Uploading…</span><span style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{uploadProgress}%</span></div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'var(--bg-input)' }}><div style={{ width: `${uploadProgress}%`, height: '100%', borderRadius: '3px', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', transition: 'width 0.3s' }} /></div>
            </div>}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Link to Job (optional)</div>
              <select value={linkedJob} onChange={e => setLinkedJob(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '11px 14px', fontFamily: 'var(--font)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none', width: '100%' }}>
                <option value="">No job linked</option>
                {jobs.map(j => <option key={j.id} value={`${j.jobNumber} — ${j.company}`}>{j.jobNumber} — {j.company}</option>)}
              </select>
            </div>
          </div>
          <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <button onClick={resetUpload} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Cancel</button>
            <button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: uploading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: uploading ? 'none' : '0 4px 16px rgba(76,158,235,0.3)', opacity: selectedFiles.length === 0 ? 0.5 : 1 }}>
              {uploading ? <>Uploading…</> : <>Upload</>}
            </button>
          </div>
        </div>
      </>}

      {/* ═══ PREVIEW PANEL ═══ */}
      {previewOpen && previewDoc && <>
        <div onClick={() => setPreviewOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '580px', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
              <div><div style={{ fontSize: '17px', fontWeight: 800 }}>File Preview</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{previewDoc.name}</div></div>
            </div>
            <button onClick={() => setPreviewOpen(false)} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
            {/* Inline preview for images */}
            {previewDoc.type === 'image' && previewDoc.storageUrl && (
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '300px', overflow: 'hidden' }}>
                <img src={previewDoc.storageUrl} alt={previewDoc.name} style={{ maxWidth: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            )}
            {/* Hero for non-images */}
            {previewDoc.type !== 'image' && (
              <div style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: (typeConfig[previewDoc.type] ?? typeConfig.doc).iconBg, color: (typeConfig[previewDoc.type] ?? typeConfig.doc).iconColor }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}>{fileTypeIcon(previewDoc.type)}</svg></div>
                <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px' }}>{previewDoc.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{previewDoc.size} · {(typeConfig[previewDoc.type] ?? typeConfig.doc).label}</div>
              </div>
            )}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
                {[{ l: 'File Name', v: previewDoc.name }, { l: 'Type', v: (typeConfig[previewDoc.type] ?? typeConfig.doc).label }, { l: 'Size', v: previewDoc.size, m: true }, { l: 'Uploaded', v: formatDate(previewDoc.createdAt), m: true, last: false }].map(r => (
                  <div key={r.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: r.last ? 'none' : '1px solid var(--border)' }}><span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{r.l}</span><span style={{ fontSize: '13px', fontWeight: 600, fontFamily: r.m ? 'var(--mono)' : undefined }}>{r.v}</span></div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Linked Job</span>
                  <select
                    value={previewDoc.jobNumber ? `${previewDoc.jobNumber} — ${previewDoc.company}` : ''}
                    onChange={e => handleLinkJob(previewDoc, e.target.value)}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 600, color: previewDoc.jobNumber ? 'var(--accent)' : 'var(--text-muted)', outline: 'none', maxWidth: '220px', cursor: 'pointer' }}
                  >
                    <option value="">No job linked</option>
                    {jobs
                      .slice()
                      .sort((a, b) => b.jobNumber.localeCompare(a.jobNumber))
                      .slice(0, 20)
                      .map(j => (
                        <option key={j.id} value={`${j.jobNumber} — ${j.company}`}>
                          {j.jobNumber} — {j.company}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
            {isViewable(previewDoc.type, previewDoc.mimeType) && (
              <button onClick={() => { setPreviewOpen(false); openViewer(previewDoc); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--accent-glow-strong)', color: 'var(--accent-bright)', border: '1px solid rgba(76,158,235,0.3)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>View
              </button>
            )}
            <button onClick={() => handleDownload(previewDoc)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download
            </button>
          </div>
        </div>
      </>}

      {/* ═══ FULL-SCREEN VIEWER MODAL ═══ */}
      {viewerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', flexDirection: 'column', background: 'rgba(6,8,12,0.95)' }}>
          {/* Viewer header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: 'var(--accent)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{viewerName}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => window.open(viewerUrl, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'var(--font)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Open in new tab
              </button>
              <button onClick={() => setViewerOpen(false)} style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          {/* Viewer body */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '20px' }}>
            {viewerType === 'pdf' && (
              <iframe src={viewerUrl} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px', background: '#fff' }} title={viewerName} />
            )}
            {viewerType === 'image' && (
              <img src={viewerUrl} alt={viewerName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 16px 64px rgba(0,0,0,0.5)' }} />
            )}
            {viewerType === 'none' && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.3 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>This file type cannot be previewed</p>
              </div>
            )}
          </div>
        </div>
      )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } } select option { background: var(--bg-card); color: var(--text-primary); }`}</style>
      </div>
    </ProtectedRoute>
  );
}

function SC({ color, label, value, delta, icon }: { color: 'blue' | 'orange' | 'purple' | 'green'; label: string; value: number; delta: string; icon: React.ReactNode }): React.ReactNode {
  const cm = { blue: { t: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', ib: 'var(--accent-glow)', ic: 'var(--accent)', vc: 'var(--text-primary)' }, orange: { t: 'var(--orange)', ib: 'var(--orange-muted)', ic: 'var(--orange)', vc: 'var(--orange)' }, purple: { t: 'var(--purple)', ib: 'var(--purple-muted)', ic: 'var(--purple)', vc: 'var(--purple)' }, green: { t: 'var(--success)', ib: 'var(--success-muted)', ic: 'var(--success)', vc: 'var(--success)' } };
  const c = cm[color];
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: c.t }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.ib, color: c.ic }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{icon}</svg></div>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: c.vc, marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-muted)' }}>{delta}</div>
    </div>
  );
}