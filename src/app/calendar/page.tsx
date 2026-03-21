'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Job } from '@/types/job';
import { onJobsSnapshot } from '@/lib/jobs';
import { useFirestore } from '@/hooks/useFirestore';
import { notifyOutlookSync } from '@/lib/notifications';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import NewJobPanel from '@/components/NewJobPanel';
import DetailPanel from '@/components/DetailPanel';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getUidSafe } from '@/lib/auth-helpers';

const SEED_JOBS: Job[] = [];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function parseJobDate(ds: string) { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); }
function parseTimeToHour(ts: string): number {
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

const JOB_COLORS = [
  { bg: 'rgba(76,158,235,0.15)', border: '#4C9EEB', text: '#6CB4FF', timeTxt: '#4C9EEB' },
  { bg: 'rgba(52,211,153,0.15)', border: '#34D399', text: '#6EE7B7', timeTxt: '#34D399' },
  { bg: 'rgba(251,146,60,0.15)', border: '#FB923C', text: '#FDBA74', timeTxt: '#FB923C' },
  { bg: 'rgba(167,139,250,0.15)', border: '#A78BFA', text: '#C4B5FD', timeTxt: '#A78BFA' },
  { bg: 'rgba(251,191,36,0.15)', border: '#FBBF24', text: '#FDE68A', timeTxt: '#FBBF24' },
  { bg: 'rgba(248,113,113,0.15)', border: '#F87171', text: '#FCA5A5', timeTxt: '#F87171' },
  { bg: 'rgba(45,212,191,0.15)', border: '#2DD4BF', text: '#5EEAD4', timeTxt: '#2DD4BF' },
  { bg: 'rgba(244,114,182,0.15)', border: '#F472B6', text: '#F9A8D4', timeTxt: '#F472B6' },
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

  // Day detail popup (desktop)
  const [dayDetailDate, setDayDetailDate] = useState<Date | null>(null);
  const [dayDetailPos, setDayDetailPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile: selected day for day picker
  const [mobileDayIdx, setMobileDayIdx] = useState<number>(-1); // -1 = auto-select today

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNewJobOpen(false); setDetailOpen(false); setDayDetailDate(null); } };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => { if (syncResult) { const t = setTimeout(() => setSyncResult(null), 5000); return () => clearTimeout(t); } }, [syncResult]);

  useEffect(() => {
    if (!dayDetailDate) return;
    const h = (e: MouseEvent) => { const el = (e.target as HTMLElement).closest('[data-day-detail]'); if (!el) setDayDetailDate(null); };
    setTimeout(() => document.addEventListener('click', h), 0);
    return () => document.removeEventListener('click', h);
  }, [dayDetailDate]);

  const weekStart = useMemo(() => { const d = new Date(currentDate); d.setDate(d.getDate() - d.getDay()); return d; }, [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; }), [weekStart]);

  // Auto-select today in day picker when week changes
  useEffect(() => {
    const todayIdx = weekDays.findIndex(d => isSameDay(d, today));
    setMobileDayIdx(todayIdx >= 0 ? todayIdx : 0);
  }, [weekDays, today]);

  const selectedMobileDay = weekDays[mobileDayIdx >= 0 ? mobileDayIdx : 0] ?? weekDays[0];

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

  // Month view: selected day for job list
  const [monthSelectedDate, setMonthSelectedDate] = useState<Date>(today);

  const getJobsForDate = useCallback((date: Date) => jobs.filter((j) => isSameDay(parseJobDate(j.date), date)), [jobs]);
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
    const uid = getUidSafe();
    if (!uid) { setSyncResult({ msg: 'Not authenticated', type: 'error' }); setSyncing(false); return; }
    try {
      const res = await fetch('/api/outlook/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) { setSyncResult({ msg: data.error || 'Sync failed', type: 'error' }); }
      else if (data.newlySynced === 0 && data.failed === 0) { setSyncResult({ msg: `All ${data.alreadySynced} active jobs already synced`, type: 'info' }); }
      else {
        const p = []; if (data.newlySynced > 0) p.push(`${data.newlySynced} new events synced`); if (data.alreadySynced > 0) p.push(`${data.alreadySynced} already up to date`); if (data.failed > 0) p.push(`${data.failed} failed`);
        setSyncResult({ msg: p.join(', '), type: data.failed > 0 ? 'error' : 'success' });
        if (data.newlySynced > 0) notifyOutlookSync(data.newlySynced).catch(() => {});
      }
    } catch { setSyncResult({ msg: 'Failed to connect to sync service', type: 'error' }); }
    setSyncing(false);
  };

  const layoutEventsForDay = (dayJobs: Job[]) => {
    const events = dayJobs.map((job, idx) => {
      const start = parseTimeToHour(job.onSiteTime);
      const dur = parseKtiHours(job.ktiTime);
      return { job, start, end: start + dur, colorIdx: idx % JOB_COLORS.length, left: 0, width: 1 };
    }).sort((a, b) => a.start - b.start || a.end - b.end);
    const columns: number[][] = [];
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

  // Mobile day view data
  const mobileDayJobs = useMemo(() => getJobsForDate(selectedMobileDay), [getJobsForDate, selectedMobileDay]);
  const mobileDayLayout = useMemo(() => layoutEventsForDay(mobileDayJobs), [mobileDayJobs]);

  // Month view selected day jobs
  const monthDayJobs = useMemo(() =>
    getJobsForDate(monthSelectedDate).sort((a, b) => parseTimeToHour(a.onSiteTime) - parseTimeToHour(b.onSiteTime)),
    [getJobsForDate, monthSelectedDate]);

  return (
    <ProtectedRoute>
      <div className="cal-page">
        <Sidebar />
        <div className="cal-main app-main">
          <Topbar onNewJob={handleNewJob} />
          <main className="cal-content">
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>Loading…</div>
            ) : (<>

              {/* ═══ DESKTOP HEADER ═══ */}
              <div className="cal-header-desktop">
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
                  <button onClick={handleSyncAll} disabled={syncing} className="cal-sync-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', opacity: syncing ? 0.6 : 1 }}>
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

              {/* ═══ MOBILE HEADER (sticky, inside the content flow) ═══ */}
              <div className="cal-header-mobile">
                {/* Date nav */}
                <div className="cal-mob-nav">
                  <div className="cal-mob-title">{headerLabel}</div>
                  <div className="cal-mob-nav-btns">
                    {([-1, 1] as const).map(dir => (
                      <button key={dir} onClick={() => navigate(dir)} className="cal-mob-nav-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{dir === -1 ? <polyline points="15 18 9 12 15 6"/> : <polyline points="9 18 15 12 9 6"/>}</svg>
                      </button>))}
                    <button onClick={() => setCurrentDate(new Date())} className="cal-mob-today-btn">Today</button>
                  </div>
                </div>

                {/* Day picker strip (week/day mode only) */}
                {view === 'week' && (
                  <div className="cal-day-strip">
                    {weekDays.map((d, i) => {
                      const isToday = isSameDay(d, today);
                      const isSelected = i === mobileDayIdx;
                      const dayJobs = getJobsForDate(d);
                      return (
                        <div key={i} className={`cal-day-cell ${isSelected ? 'cal-day-selected' : ''} ${isToday ? 'cal-day-today' : ''}`}
                          onClick={() => setMobileDayIdx(i)}>
                          <div className="cal-day-dow">{DAYS[d.getDay()].slice(0, 3)}</div>
                          <div className="cal-day-num">{d.getDate()}</div>
                          <div className="cal-day-jcount">{dayJobs.length > 0 ? `${dayJobs.length} job${dayJobs.length > 1 ? 's' : ''}` : ''}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* View toggle */}
                <div className="cal-mob-toggle-row">
                  <div className="cal-mob-toggle">
                    <button className={`cal-mob-vtab ${view === 'week' ? 'cal-mob-vtab-active' : ''}`} onClick={() => setView('week')}>Day</button>
                    <button className={`cal-mob-vtab ${view === 'month' ? 'cal-mob-vtab-active' : ''}`} onClick={() => setView('month')}>Month</button>
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

              <div className="cal-body">
                <div className="cal-body-main">
                  {view === 'week' ? (<>
                    {/* ═══ DESKTOP WEEK VIEW ═══ */}
                    <div className="cal-week-desktop">
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
                                {isToday && nowHour >= 5 && nowHour <= 21 && <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'var(--danger)', zIndex: 10, top: `${(nowHour - 5) * 64}px` }}><div style={{ position: 'absolute', left: '-4px', top: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} /></div>}
                                {laidOut.map(ev => {
                                  if (ev.start < 5 || ev.start > 20) return null;
                                  const top = (ev.start - 5) * 64;
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
                    </div>

                    {/* ═══ MOBILE DAY VIEW ═══ */}
                    <div className="cal-day-mobile">
                      {mobileDayJobs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.3 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <p style={{ fontSize: '14px', fontWeight: 600 }}>No jobs on {selectedMobileDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                        </div>
                      ) : (
                        <div className="cal-day-timegrid">
                          {HOURS.map(h => {
                            // Find any events that start in this hour
                            const eventsInSlot = mobileDayLayout.filter(ev => Math.floor(ev.start) === h);
                            return (
                              <div key={h} className="cal-day-slot">
                                <div className="cal-day-time-label">{formatHour(h)}</div>
                                <div className="cal-day-time-content">
                                  {eventsInSlot.map(ev => {
                                    const c = JOB_COLORS[ev.colorIdx];
                                    const height = Math.max((ev.end - ev.start) * 60, 50);
                                    return (
                                      <div key={ev.job.id} onClick={() => handleJobClick(ev.job)}
                                        className="cal-day-job-block"
                                        style={{ minHeight: `${height}px`, background: c.bg, borderLeftColor: c.border }}>
                                        <div className="cal-day-jb-time" style={{ color: c.timeTxt }}>{formatTimeDisplay(ev.job.onSiteTime)} · {ev.job.ktiTime}</div>
                                        <div className="cal-day-jb-name">{ev.job.company}</div>
                                        {ev.job.scope && <div className="cal-day-jb-scope">{ev.job.scope}</div>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>) : (<>
                    {/* ═══ DESKTOP MONTH VIEW ═══ */}
                    <div className="cal-month-desktop">
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
                    </div>

                    {/* ═══ MOBILE MONTH VIEW ═══ */}
                    <div className="cal-month-mobile">
                      {/* Dot grid */}
                      <div className="cal-mob-month-grid">
                        <div className="cal-mob-dow-row">
                          {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="cal-mob-dow">{d}</div>)}
                        </div>
                        <div className="cal-mob-day-grid">
                          {monthGrid.map((cell, ci) => {
                            const dayJobs = getJobsForDate(cell.date);
                            const isToday = isSameDay(cell.date, today);
                            const isSel = isSameDay(cell.date, monthSelectedDate);
                            return (
                              <div key={ci}
                                className={`cal-mob-day ${isToday ? 'cal-mob-day-today' : ''} ${isSel ? 'cal-mob-day-selected' : ''} ${!cell.inMonth ? 'cal-mob-day-other' : ''}`}
                                onClick={() => { if (cell.inMonth) setMonthSelectedDate(cell.date); }}>
                                <div className="cal-mob-day-n">{cell.date.getDate()}</div>
                                <div className="cal-mob-day-dots">
                                  {dayJobs.slice(0, 3).map((j, i) => (
                                    <div key={i} className="cal-mob-dot" style={{ background: statusDotColors[j.status] ?? 'var(--text-muted)' }} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected day job list */}
                      <div className="cal-mob-day-list">
                        <div className="cal-mob-day-list-head">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {monthSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          <span className="cal-mob-day-list-cnt">· {monthDayJobs.length} job{monthDayJobs.length !== 1 ? 's' : ''}</span>
                        </div>
                        {monthDayJobs.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>No jobs on this day</div>
                        ) : monthDayJobs.map((job, idx) => {
                          const c = JOB_COLORS[idx % JOB_COLORS.length];
                          return (
                            <div key={job.id} className="cal-mob-job-item" onClick={() => handleJobClick(job)}>
                              <div className="cal-mob-job-bar" style={{ background: c.border }} />
                              <div className="cal-mob-job-info">
                                <div className="cal-mob-job-time" style={{ color: c.timeTxt }}>{formatTimeDisplay(job.onSiteTime)} · {job.ktiTime}</div>
                                <div className="cal-mob-job-name">{job.company}</div>
                                {job.scope && <div className="cal-mob-job-scope">{job.scope}</div>}
                              </div>
                              <div className="cal-mob-job-chevron">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>)}
                </div>

                {/* ═══ UPCOMING SIDEBAR (desktop only) ═══ */}
                <div className="cal-upcoming-sidebar">
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

        {/* ═══ DAY DETAIL POPUP (desktop only) ═══ */}
        {dayDetailDate && (() => {
          const dayJobs = getJobsForDate(dayDetailDate).sort((a, b) => parseTimeToHour(a.onSiteTime) - parseTimeToHour(b.onSiteTime));
          const isToday = isSameDay(dayDetailDate, today);
          return (
            <div data-day-detail className="cal-day-popup" style={{ left: Math.min(dayDetailPos.x - 160, window.innerWidth - 340), top: dayDetailPos.y + 60 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isToday && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />}
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{dayDetailDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
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

      <style>{`
        .cal-page { display: flex; min-height: 100vh; background: var(--bg-void); }
        .cal-main { margin-left: var(--sidebar-width); flex: 1; display: flex; flex-direction: column; min-height: 100vh; min-width: 0; overflow: hidden; }
        .cal-content { padding: 28px 32px; flex: 1; }

        .cal-header-desktop { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .cal-header-mobile { display: none; }

        .cal-body { display: flex; gap: 20px; }
        .cal-body-main { flex: 1; min-width: 0; }
        .cal-upcoming-sidebar { width: 260px; flex-shrink: 0; }

        .cal-week-desktop { display: block; }
        .cal-day-mobile { display: none; }
        .cal-month-desktop { display: block; }
        .cal-month-mobile { display: none; }

        .cal-day-popup {
          position: fixed; z-index: 400; width: 320px; max-height: 400px;
          background: var(--bg-sidebar); border: 1px solid var(--border);
          border-radius: var(--radius); box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          overflow: hidden; display: flex; flex-direction: column;
        }

        /* ═══ MOBILE — ≤768px ═══ */
        @media (max-width: 768px) {
          .cal-main { margin-left: 0; }
          .cal-content { padding: 0; padding-bottom: calc(var(--tabbar-height) + 16px); }

          /* Swap headers */
          .cal-header-desktop { display: none; }
          .cal-header-mobile {
            display: block;
            position: sticky; top: 0; z-index: 40;
            background: var(--bg-sidebar);
            border-bottom: 1px solid var(--border);
            padding: 12px 16px;
          }

          /* Mobile nav row */
          .cal-mob-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
          .cal-mob-title { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
          .cal-mob-nav-btns { display: flex; gap: 6px; align-items: center; }
          .cal-mob-nav-btn {
            width: 32px; height: 32px; border-radius: var(--radius-xs);
            background: var(--bg-card); border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            color: var(--text-muted); cursor: pointer;
          }
          .cal-mob-today-btn {
            height: 32px; padding: 0 12px; border-radius: var(--radius-xs);
            background: var(--bg-card); border: 1px solid var(--border);
            font-family: var(--font); font-size: 12px; font-weight: 600;
            color: var(--text-secondary); cursor: pointer;
          }

          /* Day picker strip */
          .cal-day-strip {
            display: flex; gap: 4px; margin-bottom: 10px;
          }
          .cal-day-cell {
            flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
            padding: 8px 2px; border-radius: var(--radius-xs); cursor: pointer;
            -webkit-tap-highlight-color: transparent; min-height: 44px;
          }
          .cal-day-selected { background: var(--accent-glow-strong); outline: 1px solid rgba(76,158,235,0.3); }
          .cal-day-dow { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
          .cal-day-num { font-size: 16px; font-weight: 700; color: var(--text-secondary); }
          .cal-day-selected .cal-day-num { color: var(--accent-bright); }
          .cal-day-today .cal-day-num {
            width: 28px; height: 28px; border-radius: 50%;
            background: var(--accent); color: #fff !important;
            display: flex; align-items: center; justify-content: center;
          }
          .cal-day-jcount { font-size: 9px; font-family: var(--mono); color: var(--text-muted); min-height: 12px; }
          .cal-day-selected .cal-day-jcount { color: var(--accent-dim); }

          /* View toggle */
          .cal-mob-toggle-row { display: flex; justify-content: center; padding-bottom: 4px; }
          .cal-mob-toggle {
            display: flex; gap: 2px; background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius-xs); padding: 3px;
          }
          .cal-mob-vtab {
            padding: 6px 20px; border-radius: 4px; font-size: 12px; font-weight: 700;
            color: var(--text-muted); background: transparent; border: none;
            font-family: var(--font); cursor: pointer;
          }
          .cal-mob-vtab-active { background: var(--accent-glow-strong); color: var(--accent-bright); }

          /* Hide desktop views, show mobile */
          .cal-week-desktop { display: none !important; }
          .cal-day-mobile { display: block; }
          .cal-month-desktop { display: none !important; }
          .cal-month-mobile { display: block; }
          .cal-upcoming-sidebar { display: none !important; }
          .cal-day-popup { display: none !important; }

          /* Body: no flex gap on mobile */
          .cal-body { flex-direction: column; gap: 0; }

          /* ── Mobile Day View ── */
          .cal-day-timegrid { padding: 8px 16px 16px; }
          .cal-day-slot { display: flex; align-items: flex-start; min-height: 60px; border-top: 1px solid rgba(30,39,54,0.5); }
          .cal-day-time-label { width: 48px; flex-shrink: 0; font-size: 10px; font-family: var(--mono); font-weight: 500; color: var(--text-muted); padding-top: 4px; }
          .cal-day-time-content { flex: 1; position: relative; min-height: 60px; padding: 2px 0; }
          .cal-day-job-block {
            border-radius: 8px; padding: 10px 12px; margin-bottom: 4px;
            border-left: 3px solid; cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          .cal-day-job-block:active { opacity: 0.8; }
          .cal-day-jb-time { font-size: 11px; font-family: var(--mono); font-weight: 600; margin-bottom: 2px; }
          .cal-day-jb-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
          .cal-day-jb-scope { font-size: 11px; color: var(--text-muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* ── Mobile Month View ── */
          .cal-mob-month-grid { padding: 12px 16px 0; }
          .cal-mob-dow-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px; }
          .cal-mob-dow { text-align: center; font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; padding: 4px 0; }
          .cal-mob-day-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
          .cal-mob-day {
            aspect-ratio: 1; display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 3px; border-radius: var(--radius-xs); cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          .cal-mob-day-today .cal-mob-day-n {
            width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff;
            display: flex; align-items: center; justify-content: center;
          }
          .cal-mob-day-selected { background: var(--accent-glow-strong); outline: 1px solid rgba(76,158,235,0.3); }
          .cal-mob-day-other { opacity: 0.3; }
          .cal-mob-day-n { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
          .cal-mob-day-dots { display: flex; gap: 2px; min-height: 5px; }
          .cal-mob-dot { width: 5px; height: 5px; border-radius: 50%; }

          /* Selected day job list */
          .cal-mob-day-list { padding: 0 16px 16px; }
          .cal-mob-day-list-head {
            font-size: 13px; font-weight: 700; color: var(--text-secondary);
            padding: 14px 0 10px; border-top: 1px solid var(--border);
            display: flex; align-items: center; gap: 6px;
          }
          .cal-mob-day-list-cnt { font-family: var(--mono); font-size: 11px; color: var(--text-muted); font-weight: 500; }

          .cal-mob-job-item {
            display: flex; align-items: center; gap: 12px; padding: 12px 14px;
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius-sm); margin-bottom: 8px; cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          .cal-mob-job-item:active { background: var(--bg-hover); }
          .cal-mob-job-bar { width: 3px; height: 36px; border-radius: 2px; flex-shrink: 0; }
          .cal-mob-job-info { flex: 1; min-width: 0; }
          .cal-mob-job-time { font-size: 11px; font-family: var(--mono); font-weight: 600; margin-bottom: 2px; }
          .cal-mob-job-name { font-size: 14px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cal-mob-job-scope { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .cal-mob-job-chevron { color: var(--text-muted); flex-shrink: 0; }
        }

        @media (max-width: 390px) {
          .cal-mob-title { font-size: 15px; }
          .cal-day-num { font-size: 14px; }
          .cal-day-timegrid { padding: 8px 12px 12px; }
          .cal-mob-month-grid { padding: 10px 12px 0; }
          .cal-mob-day-list { padding: 0 12px 12px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </ProtectedRoute>
  );
}