'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/hooks/useFirestore';
import { onJobsSnapshot } from '@/lib/jobs';
import { onNotificationsSnapshot } from '@/lib/notifications';
import { Job } from '@/types/job';

interface Notif { id: string; unread: boolean; [key: string]: unknown; }

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: jobs } = useFirestore<Job>(onJobsSnapshot, []);
  const { data: notifs } = useFirestore<Notif>(onNotificationsSnapshot as unknown as (cb: (d: Notif[]) => void, err?: (e: Error) => void) => () => void, []);

  const activeJobCount = jobs.filter(j => j.status !== 'completed').length || jobs.length;
  const unreadCount = notifs.filter(n => n.unread).length;

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const navMain = [
    { label: 'Jobs', href: '/jobs', badge: String(activeJobCount), icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    { label: 'Calendar', href: '/calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
    { label: 'Contacts', href: '/contacts', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
    { label: 'Documents', href: '/documents', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: 'Notifications', href: '/notifications', badge: unreadCount > 0 ? String(unreadCount) : undefined, icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
  ];

  const navSettings = [
    { label: 'Integrations', href: '/integrations', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
  ];

  /* ── Bottom tab bar items (mobile only) ── */
  const tabItems = [
    { label: 'Jobs', href: '/jobs', badge: String(activeJobCount), icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
    { label: 'Calendar', href: '/calendar', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
    { label: 'Contacts', href: '/contacts', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> },
    { label: 'Docs', href: '/documents', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></> },
    { label: 'Alerts', href: '/notifications', dot: unreadCount > 0, icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const NavItem = ({ item, active }: { item: typeof navMain[0]; active: boolean }) => (
    <Link href={item.href}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: active ? 'var(--accent-bright)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.15s', marginBottom: '2px', background: active ? 'var(--accent-glow-strong)' : 'transparent', textDecoration: 'none' }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; } }}
    >
      {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: GRADIENT_ACCENT, borderRadius: '0 3px 3px 0' }} />}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{item.icon}</svg>
      {item.label}
      {item.badge && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            fontWeight: 700,
            background: item.label === 'Notifications' ? 'var(--danger-muted)' : 'var(--accent-glow)',
            color: item.label === 'Notifications' ? 'var(--danger)' : 'var(--accent)',
            padding: '2px 8px',
            borderRadius: '10px',
            fontFamily: 'var(--mono)',
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <nav className="sidebar-desktop">
        {/* Brand */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: GRADIENT_ACCENT, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: '14px', color: '#fff', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>FO</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.03em' }}><span className="gradient-text">FieldOps</span></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontWeight: 500 }}>v1.0</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '14px 12px', flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '16px 10px 8px' }}>Main</div>
          {navMain.map(item => <NavItem key={item.label} item={item} active={isActive(item.href)} />)}

          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '16px 10px 8px' }}>Settings</div>
          {navSettings.map(item => <NavItem key={item.label} item={item} active={isActive(item.href)} />)}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--accent-glow)', border: '1px solid rgba(76,158,235,0.15)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-bright)' }}>Outlook Synced</div>
              <div style={{ fontSize: '10px', color: 'var(--accent-dim)', fontFamily: 'var(--mono)' }}>Connected</div>
            </div>
          </div>

          {/* User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', marginTop: '8px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: GRADIENT_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', color: '#fff', flexShrink: 0 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin</div>
            </div>
            <button onClick={handleLogout} title="Sign out"
              style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid transparent', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-muted)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ MOBILE BOTTOM TAB BAR ═══ */}
      <nav className="tabbar-mobile">
        {tabItems.map(tab => {
          const active = isActive(tab.href);
          return (
            <Link key={tab.label} href={tab.href} className={`tabbar-tab ${active ? 'tabbar-tab-active' : ''}`}>
              <div className="tabbar-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="tabbar-icon">{tab.icon}</svg>
                {tab.badge && <span className="tabbar-badge">{tab.badge}</span>}
                {tab.dot && <span className="tabbar-dot" />}
              </div>
              <span className="tabbar-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <style>{`
        /* ═══ DESKTOP SIDEBAR ═══ */
        .sidebar-desktop {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        /* ═══ MOBILE TAB BAR ═══ */
        .tabbar-mobile {
          display: none;
        }

        /* ── ≤768px: hide sidebar, show tab bar ── */
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none;
          }

          .tabbar-mobile {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 100;
            background: var(--bg-sidebar);
            border-top: 1px solid var(--border);
            justify-content: space-around;
            padding: 6px 0 env(safe-area-inset-bottom, 16px);
          }

          .tabbar-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            padding: 6px 10px;
            color: var(--text-muted);
            text-decoration: none;
            position: relative;
            -webkit-tap-highlight-color: transparent;
            transition: color 0.15s;
          }

          .tabbar-tab-active {
            color: var(--accent-bright);
          }

          .tabbar-icon-wrap {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .tabbar-icon {
            width: 22px;
            height: 22px;
          }

          .tabbar-label {
            font-size: 10px;
            font-weight: 600;
            line-height: 1;
          }

          .tabbar-badge {
            position: absolute;
            top: -4px;
            right: -10px;
            min-width: 16px;
            height: 16px;
            border-radius: 8px;
            background: var(--accent);
            color: #fff;
            font-size: 9px;
            font-weight: 800;
            font-family: var(--mono);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
          }

          .tabbar-dot {
            position: absolute;
            top: -1px;
            right: -4px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--danger);
          }
        }
      `}</style>
    </>
  );
}