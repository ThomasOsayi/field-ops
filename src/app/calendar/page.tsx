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

/* ── Seed data (same as jobs page, used as fallback) ── */
const SEED_JOBS: Job[] = [
  {
    id: 'seed-1', jobNumber: 'JOB-2401', company: 'Meridian Controls',
    address: '4521 Industrial Blvd, Houston TX', contactName: 'Mike Torres',
    contactPhone: '(832) 555-0147', ktiTime: '4 hrs', onSiteTime: '10:30 AM',
    date: '2026-03-18', status: 'scheduled',
    scope: 'HVAC panel replacement, BMS integration',
    notes: 'Gate code: 4829#. Ask for building manager if Mike is unavailable. Park in loading bay B.',
    attachments: [
      { name: 'MOP-2401.pdf', url: '', size: '1.2 MB', type: 'PDF' },
      { name: 'checklist-hvac.pdf', url: '', size: '340 KB', type: 'PDF' },
      { name: 'site-photos.zip', url: '', size: '8.4 MB', type: 'Archive' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-2', jobNumber: 'JOB-2400', company: 'Atlas Data Centers',
    address: '880 Server Way, Dallas TX', contactName: 'Sarah Kim',
    contactPhone: '(469) 555-0283', ktiTime: '2 hrs', onSiteTime: '2:00 PM',
    date: '2026-03-18', status: 'in-progress',
    scope: 'UPS battery swap, thermal audit', notes: '',
    attachments: [
      { name: 'thermal-report.pdf', url: '', size: '2.1 MB', type: 'PDF' },
      { name: 'battery-specs.pdf', url: '', size: '800 KB', type: 'PDF' },
      { name: 'ups-diagram.pdf', url: '', size: '1.5 MB', type: 'PDF' },
      { name: 'site-access.pdf', url: '', size: '200 KB', type: 'PDF' },
      { name: 'photos.zip', url: '', size: '12 MB', type: 'Archive' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-3', jobNumber: 'JOB-2399', company: 'Pinnacle Logistics',
    address: '1200 Commerce Dr, Fort Worth TX', contactName: 'James Okafor',
    contactPhone: '(817) 555-0391', ktiTime: '6 hrs', onSiteTime: '8:00 AM',
    date: '2026-03-17', status: 'completed',
    scope: 'Fire alarm panel retrofit, code compliance', notes: '',
    attachments: [
      { name: 'inspection-cert.pdf', url: '', size: '500 KB', type: 'PDF' },
      { name: 'panel-wiring.pdf', url: '', size: '1.8 MB', type: 'PDF' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-4', jobNumber: 'JOB-2398', company: 'CrossPoint Electric',
    address: '760 Kirby Dr, Houston TX', contactName: 'Dev Patel',
    contactPhone: '(713) 555-0512', ktiTime: '3 hrs', onSiteTime: '1:00 PM',
    date: '2026-03-19', status: 'pending',
    scope: 'Emergency generator test, ATS inspection', notes: '',
    attachments: [{ name: 'gen-specs.pdf', url: '', size: '2.5 MB', type: 'PDF' }],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-5', jobNumber: 'JOB-2397', company: 'Zenith Mechanical',
    address: '3300 Westheimer Rd, Houston TX', contactName: 'Laura Chen',
    contactPhone: '(281) 555-0688', ktiTime: '5 hrs', onSiteTime: '9:00 AM',
    date: '2026-03-20', status: 'scheduled',
    scope: 'Chiller replacement, piping rework', notes: '',
    attachments: [
      { name: 'chiller-manual.pdf', url: '', size: '4.2 MB', type: 'PDF' },
      { name: 'piping-diagram.pdf', url: '', size: '1.1 MB', type: 'PDF' },
    ],
    createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-6', jobNumber: 'JOB-2396', company: 'Summit HVAC',
    address: '500 Main St, Houston TX', contactName: 'Ana Ruiz',
    contactPhone: '(832) 555-0999', ktiTime: '3 hrs', onSiteTime: '11:00 AM',
    date: '2026-03-21', status: 'scheduled',
    scope: 'Ductwork inspection, airflow balancing', notes: '',
    attachments: [], createdAt: '2026-03-17T00:00:00.000Z',
  },
  {
    id: 'seed-7', jobNumber: 'JOB-2395', company: 'Delta Controls',
    address: '220 Travis St, Houston TX', contactName: 'Ben Liu',
    contactPhone: '(281) 555-0777', ktiTime: '2 hrs', onSiteTime: '3:00 PM',
    date: '2026-03-22', status: 'pending',
    scope: 'BMS software update', notes: '',
    attachments: [], createdAt: '2026-03-17T00:00:00.000Z',
  },
];

/* ── Helpers ── */
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseJobDate(dateStr: string) {
  // Handle "YYYY-MM-DD" without timezone shift
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseTimeToHour(timeStr: string): number {
  // "10:30 AM" → 10.5, "2:00 PM" → 14
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 9;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h + m / 60;
}

function parseKtiHours(kti: string): number {
  const match = kti.match(/(\d+)/);
  return match ? parseInt(match[1]) : 2;
}

function formatHour(h: number): string {
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

const statusEventStyles: Record<string, { bg: string; border: string; timeColor: string; titleColor: string }> = {
  scheduled: { bg: 'var(--accent-glow)', border: 'var(--accent)', timeColor: 'var(--accent)', titleColor: 'var(--accent-bright)' },
  'in-progress': { bg: 'var(--warning-muted)', border: 'var(--warning)', timeColor: 'var(--warning)', titleColor: 'var(--warning)' },
  completed: { bg: 'var(--success-muted)', border: 'var(--success)', timeColor: 'var(--success)', titleColor: 'var(--success)' },
  pending: { bg: 'var(--purple-muted)', border: 'var(--purple)', timeColor: 'var(--purple)', titleColor: 'var(--purple)' },
};

const statusDotColors: Record<string, string> = {
  scheduled: 'var(--accent)',
  'in-progress': 'var(--warning)',
  completed: 'var(--success)',
  pending: 'var(--purple)',
};

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

/* ═══ COMPONENT ═══ */
export default function CalendarPage() {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: jobs, loading } = useFirestore<Job>(onJobsSnapshot, SEED_JOBS);

  // Panel state
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setNewJobOpen(false); setDetailOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ── Week helpers ── */
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [currentDate]);

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    }), [weekStart]);

  /* ── Month helpers ── */
  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ date: new Date(year, month - 1, prevDays - i), inMonth: false });
    for (let i = 1; i <= daysInMonth; i++)
      cells.push({ date: new Date(year, month, i), inMonth: true });
    const remaining = Math.ceil(cells.length / 7) * 7 - cells.length;
    for (let i = 1; i <= remaining; i++)
      cells.push({ date: new Date(year, month + 1, i), inMonth: false });
    return cells;
  }, [currentDate]);

  const getJobsForDate = (date: Date) =>
    jobs.filter((j) => isSameDay(parseJobDate(j.date), date));

  /* ── Nav ── */
  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const headerLabel = view === 'week'
    ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${weekDays[6].getDate()}, ${weekStart.getFullYear()}`
    : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  /* ── Panel handlers ── */
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setDetailOpen(true);
    setNewJobOpen(false);
  };

  const handleEditClick = (job: Job) => {
    setSelectedJob(job);
    setNewJobOpen(true);
    setDetailOpen(false);
  };

  const handleNewJob = () => {
    setSelectedJob(null);
    setNewJobOpen(true);
    setDetailOpen(false);
  };

  /* ── Upcoming jobs ── */
  const upcomingJobs = useMemo(() =>
    jobs
      .filter((j) => parseJobDate(j.date) >= today && j.status !== 'completed')
      .sort((a, b) => {
        const dateDiff = parseJobDate(a.date).getTime() - parseJobDate(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return parseTimeToHour(a.onSiteTime) - parseTimeToHour(b.onSiteTime);
      })
      .slice(0, 5),
    [jobs, today]);

  /* ── Now indicator ── */
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
        <Sidebar />

        <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
          <Topbar onNewJob={handleNewJob} />

          <main style={{ padding: '28px 32px', flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', marginRight: '8px', animation: 'spin 0.8s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Loading…
              </div>
            ) : (
              <>
              {/* ── Calendar Header ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>{headerLabel}</h2>

                  {/* Nav arrows */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {([-1, 1] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => navigate(dir)}
                        style={{
                          width: '32px', height: '32px', borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                          {dir === -1
                            ? <polyline points="15 18 9 12 15 6"/>
                            : <polyline points="9 18 15 12 9 6"/>}
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Today */}
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontFamily: 'var(--font)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                  >
                    Today
                  </button>
                </div>

                {/* View Toggle */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px' }}>
                  {(['week', 'month'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      style={{
                        padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', border: 'none', fontFamily: 'var(--font)', transition: 'all 0.15s',
                        background: view === v ? 'var(--accent-glow-strong)' : 'transparent',
                        color: view === v ? 'var(--accent-bright)' : 'var(--text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Layout: Calendar + Sidebar ── */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {view === 'week' ? (
                    /* ═══ WEEK VIEW ═══ */
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                        <div style={{ padding: '12px 8px', borderRight: '1px solid var(--border)' }} />
                        {weekDays.map((d, i) => {
                          const isToday = isSameDay(d, today);
                          return (
                            <div key={i} style={{ padding: '12px 10px', textAlign: 'center', borderRight: i < 6 ? '1px solid var(--border)' : 'none' }}>
                              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                {DAYS[d.getDay()]}
                              </div>
                              {isToday ? (
                                <div style={{
                                  width: '32px', height: '32px', margin: '0 auto',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  borderRadius: '50%', background: GRADIENT_ACCENT,
                                  fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: '#fff',
                                }}>
                                  {d.getDate()}
                                </div>
                              ) : (
                                <div style={{ fontFamily: 'var(--mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                  {d.getDate()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Body */}
                      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)' }}>
                        {/* Time column */}
                        <div style={{ borderRight: '1px solid var(--border)' }}>
                          {HOURS.map((h) => (
                            <div key={h} style={{
                              height: '64px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                              padding: '0 8px', fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 500,
                              color: 'var(--text-muted)', transform: 'translateY(-6px)',
                            }}>
                              {formatHour(h)}
                            </div>
                          ))}
                        </div>

                        {/* Day columns */}
                        {weekDays.map((d, di) => {
                          const dayJobs = getJobsForDate(d);
                          const isToday = isSameDay(d, today);
                          return (
                            <div key={di} style={{ borderRight: di < 6 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
                              {HOURS.map((h) => (
                                <div key={h} style={{ height: '64px', borderBottom: '1px solid var(--border)' }} />
                              ))}

                              {/* Now indicator */}
                              {isToday && nowHour >= 7 && nowHour <= 19 && (
                                <div style={{
                                  position: 'absolute', left: 0, right: 0, height: '2px',
                                  background: 'var(--danger)', zIndex: 10,
                                  top: `${(nowHour - 7) * 64}px`,
                                }}>
                                  <div style={{
                                    position: 'absolute', left: '-4px', top: '-3px',
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: 'var(--danger)',
                                  }} />
                                </div>
                              )}

                              {/* Events */}
                              {dayJobs.map((job) => {
                                const hour = parseTimeToHour(job.onSiteTime);
                                const kti = parseKtiHours(job.ktiTime);
                                if (hour < 7 || hour > 18) return null;
                                const top = (hour - 7) * 64;
                                const height = Math.max(kti * 64, 48);
                                const es = statusEventStyles[job.status] ?? statusEventStyles.scheduled;
                                return (
                                  <div
                                    key={job.id}
                                    onClick={() => handleJobClick(job)}
                                    style={{
                                      position: 'absolute', left: '4px', right: '4px',
                                      top: `${top}px`, height: `${height}px`,
                                      borderRadius: '6px', padding: '6px 8px',
                                      cursor: 'pointer', overflow: 'hidden', zIndex: 5,
                                      background: es.bg, borderLeft: `3px solid ${es.border}`,
                                      transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                                  >
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, marginBottom: '2px', color: es.timeColor, opacity: 0.8 }}>
                                      {job.onSiteTime} · {job.ktiTime}
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: es.titleColor }}>
                                      {job.company}
                                    </div>
                                    {height >= 64 && (
                                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                                        {job.scope}
                                      </div>
                                    )}
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
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                        {DAYS.map((d, i) => (
                          <div key={d} style={{
                            padding: '12px', textAlign: 'center',
                            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.06em', color: 'var(--text-muted)',
                            borderRight: i < 6 ? '1px solid var(--border)' : 'none',
                          }}>
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                        {monthGrid.map((cell, ci) => {
                          const dayJobs = getJobsForDate(cell.date);
                          const isToday = isSameDay(cell.date, today);
                          return (
                            <div
                              key={ci}
                              style={{
                                minHeight: '110px', padding: '8px',
                                overflow: 'hidden',
                                borderRight: (ci + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                                borderBottom: '1px solid var(--border)',
                                opacity: cell.inMonth ? 1 : 0.35,
                                cursor: 'pointer', transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                            >
                              {isToday ? (
                                <div style={{
                                  width: '24px', height: '24px', display: 'inline-flex',
                                  alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                                  background: GRADIENT_ACCENT, fontFamily: 'var(--mono)',
                                  fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '6px',
                                }}>
                                  {cell.date.getDate()}
                                </div>
                              ) : (
                                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                  {cell.date.getDate()}
                                </div>
                              )}

                              {dayJobs.slice(0, 3).map((job) => {
                                const dotColor = statusDotColors[job.status] ?? 'var(--text-muted)';
                                const es = statusEventStyles[job.status] ?? statusEventStyles.scheduled;
                                return (
                                  <div
                                    key={job.id}
                                    onClick={(e) => { e.stopPropagation(); handleJobClick(job); }}
                                    style={{
                                      padding: '3px 6px', marginBottom: '3px', borderRadius: '4px',
                                      display: 'flex', alignItems: 'center', gap: '5px',
                                      background: es.bg, cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)'; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; }}
                                  >
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                                    <span style={{ fontSize: '10px', fontWeight: 600, color: es.titleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {job.onSiteTime} {job.company}
                                    </span>
                                  </div>
                                );
                              })}

                              {dayJobs.length > 3 && (
                                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '2px 6px', cursor: 'pointer' }}>
                                  +{dayJobs.length - 3} more
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Upcoming Sidebar ── */}
                <div style={{ width: '260px', flexShrink: 0 }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                    <div style={{
                      padding: '14px 16px', fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: 'var(--text-muted)', background: 'var(--bg-surface)',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: '7px',
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Upcoming Jobs
                    </div>

                    {upcomingJobs.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                        No upcoming jobs
                      </div>
                    ) : (
                      upcomingJobs.map((job, i) => {
                        const jDate = parseJobDate(job.date);
                        const dateLabel = isSameDay(jDate, today) ? 'Today'
                          : isSameDay(jDate, new Date(today.getTime() + 86400000)) ? 'Tomorrow'
                          : `${MONTHS[jDate.getMonth()].slice(0, 3)} ${jDate.getDate()}`;
                        const timeColor = statusDotColors[job.status] ?? 'var(--text-muted)';

                        return (
                          <div
                            key={job.id}
                            onClick={() => handleJobClick(job)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: i < upcomingJobs.length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                          >
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, color: timeColor, marginBottom: '4px' }}>
                              {job.onSiteTime} · {dateLabel}
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>
                              {job.company}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {job.scope}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Panels */}
      <NewJobPanel open={newJobOpen} onClose={() => setNewJobOpen(false)} onJobCreated={() => {}} />
      <DetailPanel open={detailOpen} job={selectedJob} onClose={() => setDetailOpen(false)} onEdit={handleEditClick} onJobUpdated={() => {}} />
      </div>
    </ProtectedRoute>
  );
}