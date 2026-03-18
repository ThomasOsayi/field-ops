'use client';

import { useEffect, useState, useMemo } from 'react';
import { Job } from '@/types/job';
import { onJobsSnapshot } from '@/lib/jobs';
import { useFirestore } from '@/hooks/useFirestore';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import NewJobPanel from '@/components/NewJobPanel';
import DetailPanel from '@/components/DetailPanel';
import ProtectedRoute from '@/components/ProtectedRoute';

const SEED_JOBS: Job[] = [];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function parseJobDate(ds: string) { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); }
function parseTimeToHour(ts: string): number {
  // Handle both "10:30 AM" and "14:00" formats
  const ampm = ts.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) { let h = parseInt(ampm[1]); const min = parseInt(ampm[2]); const ap = ampm[3].toUpperCase(); if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0; return h + min / 60; }
  const mil = ts.match(/(\d+):(\d+)/);
  if (mil) { return parseInt(mil[1]) + parseInt(mil[2]) / 60; }
  return 9;
}
function parseKtiHours(kti: string): number { const m = kti.match(/(\d+)/); return m ? parseInt(m[1]) : 2; }
function formatHour(h: number): string { if (h === 12) return '12 PM'; return h > 12 ? `${h - 12} PM` : `${h} AM`; }
function formatTimeDisplay(ts: string): string {
  const h = parseTimeToHour(ts);
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayH = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayH}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

/* ── Job color palette — 8 distinct colors that cycle per-job within a day ── */
const JOB_COLORS = [
  { bg: 'rgba(76,158,235,0.15)', border: '#4C9EEB', text: '#6CB4FF', timeTxt: '#4C9EEB' },    // Blue
  { bg: 'rgba(52,211,153,0.15)', border: '#34D399', text: '#6EE7B7', timeTxt: '#34D399' },    // Green
  { bg: 'rgba(251,146,60,0.15)', border: '#FB923C', text: '#FDBA74', timeTxt: '#FB923C' },    // Orange
  { bg: 'rgba(167,139,250,0.15)', border: '#A78BFA', text: '#C4B5FD', timeTxt: '#A78BFA' },   // Purple
  { bg: 'rgba(251,191,36,0.15)', border: '#FBBF24', text: '#FDE68A', timeTxt: '#FBBF24' },    // Yellow
  { bg: 'rgba(248,113,113,0.15)', border: '#F87171', text: '#FCA5A5', timeTxt: '#F87171' },   // Red
  { bg: 'rgba(45,212,191,0.15)', border: '#2DD4BF', text: '#5EEAD4', timeTxt: '#2DD4BF' },    // Teal
  { bg: 'rgba(244,114,182,0.15)', border: '#F472B6', text: '#F9A8D4', timeTxt: '#F472B6' },   // Pink
];

const statusDotColors: Record<string, string> = { scheduled: 'var(--accent)', 'in-progress': 'var(--warning)', completed: 'var(--success)', pending: 'var(--purple)' };
const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

export default function CalendarPage() {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: jobs, loading } = useFirestore<Job>(onJobsSnapshot, SEED_JOBS);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Day detail popup
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null);
  const [dayDetailPos, setDayDetailPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNewJobOpen(false); setDetailOpen(false); setDayDetailDate(null); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { if (syncResult) { const t = setTimeout(() => setSyncResult(null), 5000); return () => clearTimeout(t); } }, [syncResult]);

  // Close day detail on click outside
  useEffect(() => {
    if (!dayDetailDate) return;
    const h = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-day-detail]');
      if (!el) setDayDetailDate(null);
    };
    setTimeout(() => document.addEventListener('click', h), 0);
    return () => document.removeEventListener('click', h);
  }, [dayDetailDate]);

  const weekStart = useMemo(() => { const d = new Date(currentDate); d.setDate(d.getDate() - d.getDay()); return d; }, [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);

  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, prevDays - i), inMonth: false });
    for (let i = 1; i <= daysInMonth; i++) cells.push({ date: new Date(year, month, i), inMonth: true });
    const rem = Math.ceil(cells.length / 7) * 7 - cells.length;
    for (let i = 1; i <= rem; i++) cells.push({ date: new Date(year, month + 1, i), inMonth: false });
    return cells;
  }, [currentDate]);

  const getJobsForDate = (date: Date) => jobs.filter((j) => isSameDay(parseJobDate(j.date), date));
  const navigate = (dir: -1 | 1) => { const d = new Date(currentDate); if (view === 'week') d.setDate(d.getDate() + dir * 7); else d.setMonth(d.getMonth() + dir); setCurrentDate(d); };
  const headerLabel = view === 'week' ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekDays[6].getDate()}, ${weekStart.getFullYear()}` : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleJobClick = (job: Job) => { setSelectedJob(job); setDetailOpen(true); setNewJobOpen(false); setDayDetailDate(null); };
  const handleEditClick = (job: Job) => { setSelectedJob(job); setNewJobOpen(true); setDetailOpen(false); };
  const handleNewJob = () => { setSelectedJob(null); setNewJobOpen(true); setDetailOpen(false); };

  const openDayDetail = (date: Date, e: React.MouseEvent) => {
    const dayJobs = getJobsForDate(date);
    if (dayJobs.length === 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDayDetailPos({ x: rect.left + rect.width / 2, y: rect.top });
    setDayDetailDate(date);
  };

  const upcomingJobs = useMemo(() =>
    jobs.filter(j => parseJobDate(j.date) >= today && j.status !== 'completed')
      .sort((a, b) => { const dd = parseJobDate(a.date).getTime() - parseJobDate(b.date).getTime(); return dd !== 0 ? dd : parseTimeToHour(a.onSiteTime) - parseTimeToHour(b.onSiteTime); })
      .slice(0, 5), [jobs, today]);

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;

  const handleSyncAll = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await fetch('/api/outlook/sync-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setSyncResult({ msg: data.error || 'Sync failed', type: 'error' }); }
      else if (data.newlySynced === 0 && data.failed === 0) { setSyncResult({ msg: `All ${data.alreadySynced} active jobs already synced`, type: 'info' }); }
      else {
        const p = []; if (data.newlySynced > 0) p.push(`${data.newlySynced} new events synced`); if (data.alreadySynced > 0) p.push(`${data.alreadySynced} already up to date`); if (data.failed > 0) p.push(`${data.failed} failed`);
        setSyncResult({ msg: p.join(', '), type: data.failed > 0 ? 'error' : 'success' });
      }
    } catch { setSyncResult({ msg: 'Failed to connect to sync service', type: 'error' }); }
    setSyncing(false);
  };

  /* ── Overlap layout: compute left offset and width for overlapping events ── */
  const layoutEventsForDay = (dayJobs: Job[]) => {
    const events = dayJobs.map((job, idx) => {
      const start = parseTimeToHour(job.onSiteTime);
      const dur = parseKtiHours(job.ktiTime);
      return { job, start, end: start + dur, colorIdx: idx % JOB_COLORS.length, left: 0, width: 1 };
    }).sort((a, b) => a.start - b.start || a.end - b.end);

    // Greedy column assignment
    const columns: number[][] = []; // columns[col] = array of event indices
    events.forEach((ev, i) => {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        const canFit = columns[c].every(j => events[j].end <= ev.start);
        if (canFit) { columns[c].push(i); ev.left = c; placed = true; break; }
      }
      if (!placed) { ev.left = columns.length; columns.push([i]); }
    });

    const totalCols = columns.length || 1;
    events.forEach(ev => { ev.width = 1 / totalCols; ev.left = ev.left / totalCols; });
    return events;
  };

  const syncResultColor = syncResult?.type === 'success' ? 'var(--success)' : syncResult?.type === 'error' ? 'var(--danger)' : 'var(--accent)';
  const syncResultBg = syncResult?.type === 'success' ? 'var(--success-muted)' : syncResult?.type === 'error' ? 'var(--danger-muted)' : 'var(--accent-glow)';

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
        <Sidebar />
        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
          <Topbar onNewJob={handleNewJob} />
          <main style={{ padding: '28px 32px', flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
            ) : (<>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>{headerLabel}</h2>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {([-1, 1] as const).map(dir => (
                      <button key={dir} onClick={() => navigate(dir)} style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{dir === -1 ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}</svg>
                      </button>))}
                  </div>
                  <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font)' }}>Today</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={handleSyncAll} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', opacity: syncing ? 0.6 : 1 }}>
                    {syncing ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', animation: 'spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Syncing…</>
                      : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Sync All to Outlook</>}
                  </button>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
                    {(['week', 'month'] as const).map(v => (
                      <button key={v} onClick={() => setView(v)} style={{ padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)', background: view === v ? 'var(--accent-glow-strong)' : 'transparent', color: view === v ? 'var(--accent-bright)' : 'var(--text-muted)', textTransform: 'capitalize' }}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>

              {syncResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', marginBottom: '16px', background: syncResultBg, border: `1px solid ${syncResultColor}22`, borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600, color: syncResultColor }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                    {syncResult.type === 'success' ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                  </svg>
                  {syncResult.msg}<span onClick={() => setSyncResult(null)} style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.6 }}>✕</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {view === 'week' ? (
                    /* ═══ WEEK VIEW ═══ */
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                        <div style={{ padding: '12px 8px', borderRight: '1px solid var(--border)' }} />
                        {weekDays.map((d, i) => { const isToday = isSameDay(d, today); const dayJobs = getJobsForDate(d); return (
                          <div key={i} onClick={(e) => openDayDetail(d, e)} style={{ padding: '12px 10px', textAlign: 'center', borderRight: i < 6 ? '1px solid var(--border)' : 'none', cursor: dayJobs.length > 0 ? 'pointer' : 'default', transition: 'background 0.15s' }}
                            onMouseEnter={e => { if (dayJobs.length > 0) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>{DAYS[d.getDay()]}</div>
                            {isToday ? <div style={{ width: '32px', height: '32px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: GRADIENT_ACCENT, fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: '#fff' }}>{d.getDate()}</div>
                              : <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>{d.getDate()}</div>}
                            {dayJobs.length > 1 && <div style={{ fontSize: '9px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', marginTop: '2px' }}>{dayJobs.length} jobs</div>}
                          </div>); })}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)' }}>
                        <div style={{ borderRight: '1px solid var(--border)' }}>
                          {HOURS.map(h => <div key={h} style={{ height: '64px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0 8px', fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', transform: 'translateY(-6px)' }}>{formatHour(h)}</div>)}
                        </div>
                        {weekDays.map((d, di) => {
                          const dayJobs = getJobsForDate(d);
                          const laidOut = layoutEventsForDay(dayJobs);
                          const isToday = isSameDay(d, today);
                          return (
                            <div key={di} style={{ borderRight: di < 6 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
                              {HOURS.map(h => <div key={h} style={{ height: '64px', borderBottom: '1px solid var(--border)' }} />)}
                              {isToday && nowHour >= 7 && nowHour <= 19 && <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'var(--danger)', zIndex: 10, top: `${(nowHour - 7) * 64}px` }}><div style={{ position: 'absolute', left: '-4px', top: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} /></div>}
                              {laidOut.map(ev => {
                                if (ev.start < 7 || ev.start > 18) return null;
                                const top = (ev.start - 7) * 64;
                                const height = Math.max((ev.end - ev.start) * 64, 44);
                                const c = JOB_COLORS[ev.colorIdx];
                                const leftPct = ev.left * 100;
                                const widthPct = ev.width * 100;
                                return (
                                  <div key={ev.job.id} onClick={() => handleJobClick(ev.job)}
                                    style={{ position: 'absolute', left: `calc(${leftPct}% + 2px)`, width: `calc(${widthPct}% - 4px)`, top: `${top}px`, height: `${height}px`, borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', overflow: 'hidden', zIndex: 5, background: c.bg, borderLeft: `3px solid ${c.border}`, transition: 'all 0.15s' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${c.border}33`; (e.currentTarget as HTMLDivElement).style.zIndex = '15'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.zIndex = '5'; }}>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 600, color: c.timeTxt, opacity: 0.9, marginBottom: '1px', whiteSpace: 'nowrap' }}>{formatTimeDisplay(ev.job.onSiteTime)} · {ev.job.ktiTime}</div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: c.text }}>{ev.job.company}</div>
                                    {height >= 64 && <div style={{ fontSize: '9px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>{ev.job.scope}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* ═══ MONTH VIEW ═══ */
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                        {DAYS.map((d, i) => <div key={d} style={{ padding: '12px', textAlign: 'center', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderRight: i < 6 ? '1px solid var(--border)' : 'none' }}>{d}</div>)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                        {monthGrid.map((cell, ci) => { const dayJobs = getJobsForDate(cell.date); const isToday = isSameDay(cell.date, today); return (
                          <div key={ci} style={{ minHeight: '110px', padding: '8px', overflow: 'hidden', borderRight: (ci + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: '1px solid var(--border)', opacity: cell.inMonth ? 1 : 0.35, cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            {isToday ? <div style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: GRADIENT_ACCENT, fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{cell.date.getDate()}</div>
                              : <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>{cell.date.getDate()}</div>}
                            {dayJobs.slice(0, 3).map((job, idx) => { const c = JOB_COLORS[idx % JOB_COLORS.length]; return (
                              <div key={job.id} onClick={e => { e.stopPropagation(); handleJobClick(job); }} style={{ padding: '3px 6px', marginBottom: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px', background: c.bg, borderLeft: `2px solid ${c.border}`, cursor: 'pointer' }}>
                                <span style={{ fontSize: '10px', fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company}</span>
                              </div>); })}
                            {dayJobs.length > 3 && <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '2px 6px' }}>+{dayJobs.length - 3} more</div>}
                          </div>); })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upcoming sidebar */}
                <div style={{ width: '260px', flexShrink: 0 }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Upcoming Jobs
                    </div>
                    {upcomingJobs.length === 0 ? <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>No upcoming jobs</div>
                      : upcomingJobs.map((job, i) => {
                        const jDate = parseJobDate(job.date);
                        const dateLabel = isSameDay(jDate, today) ? 'Today' : isSameDay(jDate, new Date(today.getTime() + 86400000)) ? 'Tomorrow' : `${MONTHS[jDate.getMonth()].slice(0, 3)} ${jDate.getDate()}`;
                        return (
                          <div key={job.id} onClick={() => handleJobClick(job)} style={{ padding: '12px 16px', borderBottom: i < upcomingJobs.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: statusDotColors[job.status] ?? 'var(--text-muted)', marginBottom: '4px' }}>{formatTimeDisplay(job.onSiteTime)} · {dateLabel}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{job.company}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.scope}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>)}
          </main>
        </div>

        {/* ═══ DAY DETAIL POPUP ═══ */}
        {dayDetailDate && (() => {
          const dayJobs = getJobsForDate(dayDetailDate).sort((a, b) => parseTimeToHour(a.onSiteTime) - parseTimeToHour(b.onSiteTime));
          const isToday = isSameDay(dayDetailDate, today);
          return (
            <div data-day-detail style={{
              position: 'fixed', zIndex: 400,
              left: Math.min(dayDetailPos.x - 160, window.innerWidth - 340),
              top: dayDetailPos.y + 60,
              width: '320px', maxHeight: '400px',
              background: 'var(--bg-sidebar)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isToday && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />}
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {dayDetailDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{dayJobs.length} job{dayJobs.length !== 1 ? 's' : ''}</span>
                </div>
                <button onClick={() => setDayDetailDate(null)} style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {dayJobs.map((job, idx) => { const c = JOB_COLORS[idx % JOB_COLORS.length]; return (
                  <div key={job.id} onClick={() => handleJobClick(job)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s', marginBottom: '4px', borderLeft: `3px solid ${c.border}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                    <div style={{ width: '6px', height: '32px', borderRadius: '3px', background: c.border, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: c.timeTxt }}>{formatTimeDisplay(job.onSiteTime)}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{job.ktiTime}</span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.scope}</div>
                    </div>
                  </div>
                ); })}
              </div>
            </div>
          );
        })()}

        <NewJobPanel open={newJobOpen} onClose={() => setNewJobOpen(false)} onJobCreated={() => {}} />
        <DetailPanel open={detailOpen} job={selectedJob} onClose={() => setDetailOpen(false)} onEdit={handleEditClick} onJobUpdated={() => {}} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </ProtectedRoute>
  );
}