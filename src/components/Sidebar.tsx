'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/hooks/useFirestore';
import { onJobsSnapshot } from '@/lib/jobs';
import { onNotificationsSnapshot } from '@/lib/notifications';
import { Job } from '@/types/job';

interface Notif { id: string; read: boolean; [key: string]: unknown; }

const GRADIENT_ACCENT = 'linear-gradient(135deg, #4C9EEB, #7B61FF)';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: jobs } = useFirestore<Job>(onJobsSnapshot, []);
  const { data: notifs } = useFirestore<Notif>(onNotificationsSnapshot as unknown as (cb: (d: Notif[]) => void, err?: (e: Error) => void) => () => void, []);

  const activeJobCount = jobs.filter(j => j.status !== 'completed').length || jobs.length;
  const hasUnread = notifs.some(n => !n.read);

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
    { label: 'Notifications', href: '/notifications', dot: hasUnread, icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></> },
  ];

  const navSettings = [
    { label: 'Integrations', href: '/integrations', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
  ];

  const NavItem = ({ item, active }: { item: typeof navMain[0]; active: boolean }) => (
    <Link href={item.href}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: 'var(--radius-sm)', color: active ? 'var(--accent-bright)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.15s', marginBottom: '2px', background: active ? 'var(--accent-glow-strong)' : 'transparent', textDecoration: 'none' }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; } }}
    >
      {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: GRADIENT_ACCENT, borderRadius: '0 3px 3px 0' }} />}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>{item.icon}</svg>
      {item.label}
      {item.badge && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: 'var(--accent-glow)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '10px', fontFamily: 'var(--mono)' }}>{item.badge}</span>}
      {item.dot && <span style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--danger)' }} />}
    </Link>
  );

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '260px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
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
        {navMain.map(item => <NavItem key={item.label} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} />)}

        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '16px 10px 8px' }}>Settings</div>
        {navSettings.map(item => <NavItem key={item.label} item={item} active={pathname === item.href} />)}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--accent-glow)', border: '1px solid rgba(76,158,235,0.15)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-bright)' }}>Outlook Synced</div>
            <div style={{ fontSize: '10px', color: 'var(--accent-dim)', fontFamily: 'var(--mono)' }}>Last: 2m ago</div>
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
  );
}