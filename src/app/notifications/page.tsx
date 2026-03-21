'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  NotifRecord,
  onNotificationsSnapshot,
  toggleNotifRead,
  markAllNotifsRead,
} from '@/lib/notifications';
import { useFirestore } from '@/hooks/useFirestore';

const SEED_NOTIFS: NotifRecord[] = [
  { id: 'n1', type: 'reminder', category: 'calendar', unread: true, titleBold: 'JOB-2401', title: ' starts in 1 hour', desc: 'Meridian Controls — HVAC panel replacement at 10:30 AM', createdAt: new Date().toISOString() },
  { id: 'n2', type: 'status', category: 'job', unread: true, titleBold: 'JOB-2400', title: ' status changed to In Progress', desc: 'Atlas Data Centers — UPS battery swap, thermal audit', createdAt: new Date().toISOString() },
  { id: 'n3', type: 'sync', category: 'outlook', unread: true, titleBold: '', title: 'Outlook Calendar synced successfully', desc: '3 events updated — JOB-2401, JOB-2400, JOB-2398', createdAt: new Date().toISOString() },
  { id: 'n4', type: 'upload', category: 'doc', unread: true, titleBold: 'JOB-2401', title: 'New document uploaded to ', desc: 'MOP-2401.pdf — 1.2 MB added by Thomas Osayi', createdAt: new Date().toISOString() },
  { id: 'n5', type: 'new-job', category: 'job', unread: true, titleBold: 'JOB-2401', title: 'New job  created', desc: 'Meridian Controls — Scheduled for Mar 18, 2026', createdAt: new Date().toISOString() },
  { id: 'n6', type: 'status', category: 'job', unread: false, titleBold: 'JOB-2399', title: ' marked as Completed', desc: 'Pinnacle Logistics — Fire alarm panel retrofit', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n7', type: 'reminder', category: 'calendar', unread: false, titleBold: 'JOB-2399', title: ' starts in 1 hour', desc: 'Pinnacle Logistics — On site at 8:00 AM', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n8', type: 'upload', category: 'doc', unread: false, titleBold: 'JOB-2399', title: '7 files uploaded to ', desc: 'Inspection cert, wiring docs, photos, signoff, permit', createdAt: new Date(Date.now() - 86400000).toISOString() },
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

const summaryDots = [
  { key: 'job', label: 'Jobs', color: 'var(--accent)' },
  { key: 'calendar', label: 'Calendar', color: 'var(--warning)' },
  { key: 'doc', label: 'Documents', color: 'var(--orange)' },
  { key: 'outlook', label: 'Outlook', color: 'var(--purple)' },
];

const notifFilters = [
  { label: 'All', value: 'all' },
  { label: 'Jobs', value: 'job' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Documents', value: 'doc' },
  { label: 'Outlook', value: 'outlook' },
];

function getDay(createdAt: string): 'today' | 'yesterday' | 'earlier' {
  const now = new Date();
  const d = new Date(createdAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  if (d >= today) return 'today';
  if (d >= yesterday) return 'yesterday';
  return 'earlier';
}

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  const day = getDay(createdAt);
  if (day === 'today' || day === 'yesterday') {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const dayLabels: Record<string, string> = { today: 'Today', yesterday: 'Yesterday', earlier: 'Earlier This Week' };
const dayOrder: ('today' | 'yesterday' | 'earlier')[] = ['today', 'yesterday', 'earlier'];

export default function NotificationsPage() {
  const { data: notifications } = useFirestore<NotifRecord>(onNotificationsSnapshot, SEED_NOTIFS);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  const filtered = useMemo(() =>
    filter === 'all' ? notifications : notifications.filter((n) => n.category === filter),
    [notifications, filter]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const grouped = useMemo(() => {
    const groups: Record<string, NotifRecord[]> = {};
    filtered.forEach((n) => {
      const day = getDay(n.createdAt);
      if (!groups[day]) groups[day] = [];
      groups[day].push(n);
    });
    return groups;
  }, [filtered]);

  const countFor = (val: string) =>
    val === 'all' ? notifications.length : notifications.filter((n) => n.category === val).length;

  const handleNotifClick = async (notif: NotifRecord) => {
    if (notif.unread) { await toggleNotifRead(notif.id, notif.unread); }
    switch (notif.category) {
      case 'job': router.push('/jobs'); break;
      case 'calendar': router.push('/calendar'); break;
      case 'doc': router.push('/documents'); break;
      case 'outlook': router.push('/integrations'); break;
      default: router.push('/jobs');
    }
  };

  const handleMarkAllRead = async () => { await markAllNotifsRead(); };

  const recentActivity = notifications.filter((n) => getDay(n.createdAt) === 'today').slice(0, 5);

  return (
    <ProtectedRoute>
      <div className="notif-page">
        <Sidebar />

        <div className="notif-main app-main">
          {/* ── Header ── */}
          <header className="notif-topbar">
            {/* Mobile brand mark */}
            <div className="notif-brand-mobile">
              <div className="notif-brand-mark">FO</div>
            </div>
            <div className="notif-topbar-left">
              <h1 className="notif-topbar-title">Notifications</h1>
              <span className="notif-unread-badge" style={{ background: unreadCount > 0 ? 'var(--danger-muted)' : 'var(--bg-elevated)', color: unreadCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
              </span>
            </div>
            <button onClick={handleMarkAllRead} className="notif-mark-btn"
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><polyline points="20 6 9 17 4 12"/></svg>
              <span className="notif-mark-text-full">Mark all read</span>
              <span className="notif-mark-text-short">Mark all</span>
            </button>
          </header>

          <main className="notif-content">
            {/* ── Filter pills ── */}
            <div className="notif-filters">
              {notifFilters.map((f) => {
                const isActive = filter === f.value;
                return (
                  <button key={f.value} onClick={() => setFilter(f.value)} className={`notif-pill ${isActive ? 'notif-pill-active' : ''}`}>
                    {f.label}<span className="notif-pill-count">{countFor(f.value)}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Layout: Feed + Sidebar ── */}
            <div className="notif-layout">
              {/* Feed */}
              <div className="notif-feed">
                {dayOrder.map((day) => {
                  if (!grouped[day]) return null;
                  return (
                    <div key={day} style={{ marginBottom: '28px' }}>
                      <div className="notif-group-label">{dayLabels[day]}</div>
                      {grouped[day].map((n) => {
                        const ic = notifIconConfig[n.type] ?? notifIconConfig.status;
                        const tag = categoryTagConfig[n.category];
                        return (
                          <div key={n.id} onClick={() => handleNotifClick(n)} className={`notif-item ${n.unread ? 'notif-item-unread' : ''}`}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}>
                            <div className="notif-item-icon" style={{ background: ic.bg, color: ic.color }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>{notifIconSvg(n.type)}</svg>
                            </div>
                            <div className="notif-item-body">
                              <div className="notif-item-title" style={{ color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {n.titleBold && <strong>{n.titleBold}</strong>}{n.title}
                              </div>
                              <div className="notif-item-desc">{n.desc}</div>
                              <div className="notif-item-meta">
                                <span className="notif-item-time">{formatTime(n.createdAt)}</span>
                                <span className="notif-item-tag" style={{ background: tag.bg, color: tag.color }}>{tag.label}</span>
                              </div>
                            </div>
                            <div className="notif-item-dot" style={{ opacity: n.unread ? 1 : 0 }} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Empty state — show inline activity summary on mobile */}
                {filtered.length === 0 && (
                  <>
                    {/* Mobile-only inline summary */}
                    <div className="notif-inline-summary">
                      <div className="notif-summary-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        Activity Summary
                      </div>
                      <div className="notif-summary-row">
                        <div className="notif-summary-left"><span className="notif-summary-dot" style={{ background: 'var(--danger)' }} />Unread</div>
                        <span className="notif-summary-val" style={{ color: 'var(--danger)' }}>{unreadCount}</span>
                      </div>
                      {summaryDots.map(s => (
                        <div key={s.key} className="notif-summary-row">
                          <div className="notif-summary-left"><span className="notif-summary-dot" style={{ background: s.color }} />{s.label}</div>
                          <span className="notif-summary-val" style={{ color: s.color }}>{notifications.filter(n => n.category === s.key).length}</span>
                        </div>
                      ))}
                    </div>
                    <div className="notif-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.3 }}>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>No notifications</p>
                    </div>
                  </>
                )}
              </div>

              {/* ── Desktop Sidebar ── */}
              <div className="notif-sidebar">
                {/* Summary */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    Activity Summary
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }} />Unread
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700, color: 'var(--danger)' }}>{unreadCount}</div>
                    </div>
                    {summaryDots.map((s, i) => (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < summaryDots.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />{s.label}
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
                    {recentActivity.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>No activity today</div>
                    ) : (
                      recentActivity.map((n, i) => {
                        const ic = notifIconConfig[n.type] ?? notifIconConfig.status;
                        return (
                          <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: ic.bg, color: ic.color }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>{notifIconSvg(n.type)}</svg>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, lineHeight: 1.4 }}>
                              {n.titleBold && <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{n.titleBold}</strong>}
                              {' '}{n.title.trim().split(' ').slice(0, 4).join(' ')}
                            </div>
                            <div style={{ fontSize: '10px', fontFamily: 'var(--mono)', color: 'var(--text-muted)', flexShrink: 0 }}>{formatTime(n.createdAt)}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style>{`
        .notif-page { display: flex; min-height: 100vh; background: var(--bg-void); }
        .notif-main { margin-left: var(--sidebar-width); flex: 1; display: flex; flex-direction: column; min-height: 100vh; min-width: 0; overflow: hidden; }
        .notif-content { padding: 28px 32px; flex: 1; }

        /* Topbar */
        .notif-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px; border-bottom: 1px solid var(--border);
          background: var(--bg-sidebar); position: sticky; top: 0; z-index: 50;
        }
        .notif-topbar-left { display: flex; align-items: center; gap: 12px; }
        .notif-topbar-title { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; }
        .notif-unread-badge { font-family: var(--mono); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
        .notif-brand-mobile { display: none; }
        .notif-brand-mark { width: 28px; height: 28px; border-radius: 7px; background: var(--gradient-accent); display: flex; align-items: center; justify-content: center; font-family: var(--mono); font-weight: 800; font-size: 10px; color: #fff; }
        .notif-mark-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); transition: all 0.15s; }
        .notif-mark-text-short { display: none; }

        /* Filters */
        .notif-filters { display: flex; gap: 6px; margin-bottom: 24px; }
        .notif-pill { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: var(--font); transition: all 0.15s; background: transparent; border: 1px solid var(--border); color: var(--text-secondary); white-space: nowrap; }
        .notif-pill-active { background: var(--accent-glow-strong); border-color: rgba(76,158,235,0.3); color: var(--accent-bright); }
        .notif-pill-count { font-family: var(--mono); font-size: 10px; font-weight: 700; opacity: 0.6; }

        /* Layout */
        .notif-layout { display: flex; gap: 20px; }
        .notif-feed { flex: 1; min-width: 0; }
        .notif-sidebar { width: 280px; flex-shrink: 0; }

        /* Group label */
        .notif-group-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 10px; padding-left: 4px; }

        /* Notification item */
        .notif-item {
          display: flex; align-items: flex-start; gap: 14px; padding: 16px 18px; margin-bottom: 6px;
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
          cursor: pointer; transition: all 0.15s; border-left: 1px solid var(--border);
        }
        .notif-item-unread { border-left: 3px solid var(--accent); }

        .notif-item-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .notif-item-body { flex: 1; min-width: 0; }
        .notif-item-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; line-height: 1.4; }
        .notif-item-title strong { font-weight: 700; color: var(--text-primary); }
        .notif-item-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; line-height: 1.4; }
        .notif-item-meta { display: flex; align-items: center; gap: 10px; }
        .notif-item-time { font-size: 10px; font-family: var(--mono); font-weight: 500; color: var(--text-muted); }
        .notif-item-tag { font-size: 9px; font-family: var(--mono); font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.03em; }
        .notif-item-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 6px; }

        .notif-empty { text-align: center; padding: 60px 20px; color: var(--text-muted); }

        /* Inline summary — hidden on desktop, shown on mobile empty state */
        .notif-inline-summary { display: none; }

        /* ═══ MOBILE ═══ */
        @media (max-width: 768px) {
          .notif-main { margin-left: 0; }
          .notif-content { padding: 0 16px 16px; padding-bottom: calc(var(--tabbar-height) + 16px); }

          /* Topbar */
          .notif-topbar { padding: 12px 16px; }
          .notif-brand-mobile { display: flex; margin-right: 8px; }
          .notif-topbar-title { font-size: 16px; }
          .notif-unread-badge { font-size: 10px; padding: 2px 8px; }
          .notif-mark-btn { padding: 0 12px; height: 36px; font-size: 11px; gap: 5px; }
          .notif-mark-text-full { display: none; }
          .notif-mark-text-short { display: inline; }

          /* Filters: horizontal scroll */
          .notif-filters {
            margin-bottom: 16px; padding: 12px 0 2px;
            overflow-x: auto; -ms-overflow-style: none; scrollbar-width: none;
          }
          .notif-filters::-webkit-scrollbar { display: none; }
          .notif-pill { flex-shrink: 0; }

          /* Hide sidebar */
          .notif-sidebar { display: none; }
          .notif-layout { flex-direction: column; gap: 0; }

          /* Notification items */
          .notif-item { padding: 14px 16px; gap: 12px; }
          .notif-item-icon { width: 36px; height: 36px; }
          .notif-item-desc { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          /* Inline summary — show on mobile when feed is empty */
          .notif-inline-summary {
            display: flex; flex-direction: column; gap: 6px;
            padding: 16px; margin-bottom: 8px;
          }
          .notif-summary-title {
            font-size: 12px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.06em; color: var(--text-muted);
            margin-bottom: 6px; display: flex; align-items: center; gap: 6px;
          }
          .notif-summary-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 14px; background: var(--bg-card); border: 1px solid var(--border);
            border-radius: var(--radius-xs);
          }
          .notif-summary-left { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
          .notif-summary-dot { width: 6px; height: 6px; border-radius: 50%; }
          .notif-summary-val { font-size: 13px; font-weight: 700; font-family: var(--mono); }

          .notif-empty { padding: 40px 20px; }
          .notif-empty svg { width: 36px; height: 36px; }
        }

        @media (max-width: 390px) {
          .notif-content { padding: 0 12px 12px; padding-bottom: calc(var(--tabbar-height) + 12px); }
          .notif-item { padding: 12px 14px; }
        }
      `}</style>
    </ProtectedRoute>
  );
}