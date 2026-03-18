'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';

/* ── Types ── */
interface Notification {
  id: string;
  type: 'status' | 'new-job' | 'reminder' | 'sync' | 'upload';
  category: 'job' | 'calendar' | 'doc' | 'outlook';
  unread: boolean;
  title: string;
  titleBold: string;
  desc: string;
  time: string;
  day: 'today' | 'yesterday' | 'earlier';
}

/* ── Seed data ── */
const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'reminder', category: 'calendar', unread: true, title: ' starts in 1 hour', titleBold: 'JOB-2401', desc: 'Meridian Controls — HVAC panel replacement at 10:30 AM', time: '9:30 AM', day: 'today' },
  { id: 'n2', type: 'status', category: 'job', unread: true, title: ' status changed to In Progress', titleBold: 'JOB-2400', desc: 'Atlas Data Centers — UPS battery swap, thermal audit', time: '8:15 AM', day: 'today' },
  { id: 'n3', type: 'sync', category: 'outlook', unread: true, title: 'Outlook Calendar synced successfully', titleBold: '', desc: '3 events updated — JOB-2401, JOB-2400, JOB-2398', time: '7:45 AM', day: 'today' },
  { id: 'n4', type: 'upload', category: 'doc', unread: true, title: 'New document uploaded to ', titleBold: 'JOB-2401', desc: 'MOP-2401.pdf — 1.2 MB added by Thomas Osayi', time: '7:30 AM', day: 'today' },
  { id: 'n5', type: 'new-job', category: 'job', unread: true, title: 'New job  created', titleBold: 'JOB-2401', desc: 'Meridian Controls — Scheduled for Mar 18, 2026', time: '7:00 AM', day: 'today' },
  { id: 'n6', type: 'status', category: 'job', unread: false, title: ' marked as Completed', titleBold: 'JOB-2399', desc: 'Pinnacle Logistics — Fire alarm panel retrofit', time: '4:30 PM', day: 'yesterday' },
  { id: 'n7', type: 'reminder', category: 'calendar', unread: false, title: ' starts in 1 hour', titleBold: 'JOB-2399', desc: 'Pinnacle Logistics — On site at 8:00 AM', time: '7:00 AM', day: 'yesterday' },
  { id: 'n8', type: 'upload', category: 'doc', unread: false, title: '7 files uploaded to ', titleBold: 'JOB-2399', desc: 'Inspection cert, wiring docs, photos, signoff, permit', time: '5:15 PM', day: 'yesterday' },
  { id: 'n9', type: 'sync', category: 'outlook', unread: false, title: 'Outlook Calendar synced', titleBold: '', desc: '5 events synchronized with your calendar', time: 'Mar 15', day: 'earlier' },
  { id: 'n10', type: 'new-job', category: 'job', unread: false, title: 'New job  created', titleBold: 'JOB-2398', desc: 'CrossPoint Electric — Emergency generator test', time: 'Mar 14', day: 'earlier' },
  { id: 'n11', type: 'reminder', category: 'calendar', unread: false, title: 'Upcoming:  tomorrow', titleBold: 'JOB-2397', desc: 'Zenith Mechanical — Chiller replacement at 9:00 AM', time: 'Mar 14', day: 'earlier' },
];

const notifIconConfig: Record<string, { bg: string; color: string }> = {
  status: { bg: 'var(--success-muted)', color: 'var(--success)' },
  'new-job': { bg: 'var(--accent-glow)', color: 'var(--accent)' },
  reminder: { bg: 'var(--warning-muted)', color: 'var(--warning)' },
  sync: { bg: 'var(--purple-muted)', color: 'var(--purple)' },
  upload: { bg: 'var(--orange-muted)', color: 'var(--orange)' },
};

const notifIconSvg = (type: string) => {
  switch (type) {
    case 'status': return <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>;
    case 'new-job': return <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>;
    case 'reminder': return <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>;
    case 'sync': return <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>;
    case 'upload': return <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>;
    default: return null;
  }
};

const categoryTagConfig: Record<string, { bg: string; color: string; label: string }> = {
  job: { bg: 'var(--accent-glow)', color: 'var(--accent)', label: 'Job' },
  calendar: { bg: 'var(--warning-muted)', color: 'var(--warning)', label: 'Calendar' },
  doc: { bg: 'var(--orange-muted)', color: 'var(--orange)', label: 'Document' },
  outlook: { bg: 'var(--purple-muted)', color: 'var(--purple)', label: 'Outlook' },
};

const summaryDots: { key: string; label: string; color: string }[] = [
  { key: 'job', label: 'Jobs', color: 'var(--accent)' },
  { key: 'calendar', label: 'Calendar', color: 'var(--warning)' },
  { key: 'doc', label: 'Documents', color: 'var(--orange)' },
  { key: 'outlook', label: 'Outlook', color: 'var(--purple)' },
];

const dayLabels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier This Week' };
const dayOrder: ('today' | 'yesterday' | 'earlier')[] = ['today', 'yesterday', 'earlier'];

const notifFilters = [
  { label: 'All', value: 'all' },
  { label: 'Jobs', value: 'job' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Documents', value: 'doc' },
  { label: 'Outlook', value: 'outlook' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() =>
    filter === 'all' ? notifications : notifications.filter((n) => n.category === filter),
    [notifications, filter]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    filtered.forEach((n) => {
      if (!groups[n.day]) groups[n.day] = [];
      groups[n.day].push(n);
    });
    return groups;
  }, [filtered]);

  const countFor = (val: string) =>
    val === 'all' ? notifications.length : notifications.filter((n) => n.category === val).length;

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Recent activity (last 5 from today)
  const recentActivity = notifications.filter((n) => n.day === 'today').slice(0, 5);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Sidebar />

      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>Notifications</h1>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '12px', fontWeight: 700, background: unreadCount > 0 ? 'var(--danger-muted)' : 'var(--bg-elevated)', color: unreadCount > 0 ? 'var(--danger)' : 'var(--text-muted)', padding: '3px 10px', borderRadius: '12px' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
            </span>
          </div>
          <button
            onClick={markAllRead}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>
            Mark all read
          </button>
        </header>

        <main style={{ padding: '28px 32px', flex: 1 }}>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
            {notifFilters.map((f) => {
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

          {/* Layout: Feed + Sidebar */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Feed */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {dayOrder.map((day) => {
                if (!grouped[day]) return null;
                return (
                  <div key={day} style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '10px', paddingLeft: '4px' }}>
                      {dayLabels[day]}
                    </div>
                    {grouped[day].map((n) => {
                      const ic = notifIconConfig[n.type] ?? notifIconConfig.status;
                      const tag = categoryTagConfig[n.category];
                      return (
                        <div
                          key={n.id}
                          onClick={() => toggleRead(n.id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '14px',
                            padding: '16px 18px', marginBottom: '6px',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            transition: 'all 0.15s',
                            borderLeft: n.unread ? '3px solid var(--accent)' : '1px solid var(--border)',
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
                        >
                          {/* Icon */}
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ic.bg, color: ic.color }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{notifIconSvg(n.type)}</svg>
                          </div>

                          {/* Body */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '3px', lineHeight: 1.4 }}>
                              {n.titleBold && <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.titleBold}</strong>}
                              {n.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: 1.4 }}>{n.desc}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--text-muted)' }}>{n.time}</span>
                              <span style={{ fontSize: '9px', fontFamily: 'var(--mono)', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.03em', background: tag.bg, color: tag.color }}>{tag.label}</span>
                            </div>
                          </div>

                          {/* Unread dot */}
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '6px', opacity: n.unread ? 1 : 0 }} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }}>
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>No notifications</p>
                </div>
              )}
            </div>

            {/* ── Right Sidebar ── */}
            <div style={{ width: '280px', flexShrink: 0 }}>
              {/* Activity Summary */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Activity Summary
                </div>
                <div style={{ padding: '16px' }}>
                  {/* Unread */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />
                      Unread
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: 'var(--danger)' }}>{unreadCount}</div>
                  </div>
                  {summaryDots.map((s, i) => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < summaryDots.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                        {s.label}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: s.color }}>
                        {notifications.filter((n) => n.category === s.key).length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Recent Activity
                </div>
                <div style={{ padding: '16px' }}>
                  {recentActivity.map((n, i) => {
                    const ic = notifIconConfig[n.type] ?? notifIconConfig.status;
                    return (
                      <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ic.bg, color: ic.color }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>{notifIconSvg(n.type)}</svg>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.4 }}>
                          {n.titleBold && <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{n.titleBold}</strong>}
                          {' '}{n.title.replace(n.titleBold, '').trim().split(' ').slice(0, 4).join(' ')}
                        </div>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', flexShrink: 0 }}>{n.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}