'use client';

import { useMemo } from 'react';
import { Job } from '@/types/job';

interface StatsRowProps {
  jobs: Job[];
}

function parseJobDate(ds: string): Date {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function parseTimeToHour(ts: string): number {
  const ampm = ts.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) { let h = parseInt(ampm[1]); const m = parseInt(ampm[2]); const ap = ampm[3].toUpperCase(); if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0; return h + m / 60; }
  const mil = ts.match(/(\d+):(\d+)/);
  if (mil) return parseInt(mil[1]) + parseInt(mil[2]) / 60;
  return 9;
}

function formatTimeDisplay(ts: string): string {
  const h = parseTimeToHour(ts);
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const dh = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${dh}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinLastDays(dateStr: string, days: number): boolean {
  const d = parseJobDate(dateStr);
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  return d >= cutoff;
}

export default function StatsRow({ jobs }: StatsRowProps) {
  const today = useMemo(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }, []);

  const stats = useMemo(() => {
    const active = jobs.filter(j => j.status !== 'completed').length;

    // Scheduled today: jobs with status 'scheduled' AND date is today
    const scheduledTodayJobs = jobs.filter(j =>
      j.status === 'scheduled' && isSameDay(parseJobDate(j.date), today)
    );
    const scheduledToday = scheduledTodayJobs.length;

    // Next scheduled job time
    const now = new Date();
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const upcoming = scheduledTodayJobs
      .filter(j => parseTimeToHour(j.onSiteTime) > nowHour)
      .sort((a, b) => parseTimeToHour(a.onSiteTime) - parseTimeToHour(b.onSiteTime));
    const nextTime = upcoming.length > 0 ? `Next at ${formatTimeDisplay(upcoming[0].onSiteTime)}` : scheduledToday > 0 ? 'All started' : 'None today';

    // In progress
    const inProgress = jobs.filter(j => j.status === 'in-progress').length;

    // In-progress jobs nearing KTI end
    const nearingEnd = jobs.filter(j => {
      if (j.status !== 'in-progress') return false;
      const start = parseTimeToHour(j.onSiteTime);
      const ktiMatch = j.ktiTime.match(/(\d+)/);
      const dur = ktiMatch ? parseInt(ktiMatch[1]) : 2;
      const endHour = start + dur;
      return nowHour >= endHour - 1 && nowHour <= endHour + 0.5;
    }).length;
    const inProgressDelta = nearingEnd > 0 ? `${nearingEnd} nearing end` : inProgress > 0 ? `${inProgress} active now` : 'None active';

    // Completed this week (last 7 days)
    const completedWeek = jobs.filter(j => j.status === 'completed' && isWithinLastDays(j.date, 7)).length;
    const completedPrevWeek = jobs.filter(j => j.status === 'completed' && isWithinLastDays(j.date, 14) && !isWithinLastDays(j.date, 7)).length;
    let completedDelta = `${completedWeek} this week`;
    if (completedPrevWeek > 0 && completedWeek > 0) {
      const pctChange = Math.round(((completedWeek - completedPrevWeek) / completedPrevWeek) * 100);
      completedDelta = pctChange >= 0 ? `↑ ${pctChange}% vs last week` : `↓ ${Math.abs(pctChange)}% vs last week`;
    }

    return { active, scheduledToday, nextTime, inProgress, inProgressDelta, nearingEnd, completedWeek, completedDelta, completedPrevWeek };
  }, [jobs, today]);

  const cards = [
    {
      topColor: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', iconBg: 'var(--accent-glow)', iconColor: 'var(--accent)',
      label: 'Active Jobs', value: stats.active, valueColor: 'var(--text-primary)',
      delta: `${stats.active} total active`, deltaType: 'neutral',
      icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    },
    {
      topColor: 'var(--warning)', iconBg: 'var(--warning-muted)', iconColor: 'var(--warning)',
      label: 'Scheduled Today', value: stats.scheduledToday, valueColor: 'var(--warning)',
      delta: stats.nextTime, deltaType: 'neutral',
      icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    },
    {
      topColor: 'var(--purple)', iconBg: 'var(--purple-muted)', iconColor: 'var(--purple)',
      label: 'In Progress', value: stats.inProgress, valueColor: 'var(--purple)',
      delta: stats.inProgressDelta, deltaType: stats.nearingEnd > 0 ? 'down' : 'neutral',
      icon: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
    },
    {
      topColor: 'var(--success)', iconBg: 'var(--success-muted)', iconColor: 'var(--success)',
      label: 'Completed (Week)', value: stats.completedWeek, valueColor: 'var(--success)',
      delta: stats.completedDelta, deltaType: stats.completedWeek >= stats.completedPrevWeek ? 'up' : 'down',
      icon: <><polyline points="20 6 9 17 4 12"/></>,
    },
  ];

  const deltaColor = (type: string) => type === 'up' ? 'var(--success)' : type === 'down' ? 'var(--danger)' : 'var(--text-muted)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
      {cards.map((s, i) => (
        <div key={s.label} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius)', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s', animation: 'fadeUp 0.4s ease forwards', animationDelay: `${(i + 1) * 0.05}s`, opacity: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: s.topColor }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.iconBg, color: s.iconColor }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{s.icon}</svg>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: s.valueColor, marginBottom: '4px' }}>{s.value}</div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 500, color: deltaColor(s.deltaType) }}>{s.delta}</div>
        </div>
      ))}
    </div>
  );
}