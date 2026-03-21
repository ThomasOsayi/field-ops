'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkOutlookConnection } from '@/lib/outlook-sync';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState('');

  useEffect(() => {
    if (open) {
      checkOutlookConnection().then(status => {
        setOutlookConnected(status.connected);
        setOutlookEmail(status.email);
      });
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => router.push(path), 200);
  };

  const handleLogout = async () => {
    onClose();
    try { await logout(); } catch (e) { console.error('Logout failed:', e); }
  };

  return (
    <>
      {/* Overlay */}
      <div className="ps-overlay" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }} onClick={onClose} />

      {/* Sheet */}
      <div ref={sheetRef} className="ps-sheet" style={{ transform: open ? 'translateY(0)' : 'translateY(100%)' }}>
        <div className="ps-handle" />

        {/* User info */}
        <div className="ps-user">
          <div className="ps-user-avatar">TO</div>
          <div className="ps-user-info">
            <div className="ps-user-name">Thomas Osayi</div>
            <div className="ps-user-role">Admin</div>
          </div>
        </div>

        {/* Outlook sync card */}
        <div className={`ps-sync-card ${outlookConnected ? 'ps-sync-connected' : ''}`}>
          <div className="ps-sync-icon-area">
            {outlookConnected ? (
              <div className="ps-sync-pulse" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px', color: 'var(--text-muted)' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
            )}
          </div>
          <div className="ps-sync-info">
            <div className="ps-sync-title">{outlookConnected ? 'Outlook Connected' : 'Outlook Not Connected'}</div>
            <div className="ps-sync-sub">{outlookConnected ? (outlookEmail || 'Calendar syncing') : 'Tap Integrations to connect'}</div>
          </div>
        </div>

        {/* Menu */}
        <div className="ps-menu">
          <button className="ps-menu-item" onClick={() => handleNavigate('/integrations')}>
            <div className="ps-menu-icon ps-menu-icon-settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09"/></svg>
            </div>
            <span className="ps-menu-label">Integrations</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ps-menu-chevron"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <div className="ps-menu-divider" />

          <button className="ps-menu-item ps-menu-item-danger" onClick={handleLogout}>
            <div className="ps-menu-icon ps-menu-icon-logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <span className="ps-menu-label">Sign Out</span>
          </button>
        </div>
      </div>

      <style>{`
        .ps-overlay {
          position: fixed; inset: 0; background: rgba(6,8,12,0.6);
          z-index: 500; transition: opacity 0.25s;
          display: none;
        }
        .ps-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 510;
          background: var(--bg-sidebar); border-top: 1px solid var(--border);
          border-radius: 20px 20px 0 0; padding: 0 0 32px;
          box-shadow: 0 -16px 48px rgba(0,0,0,0.4);
          transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
          display: none;
        }

        .ps-handle { width: 36px; height: 4px; border-radius: 2px; background: var(--border); margin: 12px auto 16px; }

        /* User */
        .ps-user {
          display: flex; align-items: center; gap: 14px; padding: 0 20px 18px;
          border-bottom: 1px solid var(--border); margin-bottom: 4px;
        }
        .ps-user-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg, #4C9EEB, #7B61FF);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 16px; color: #fff; flex-shrink: 0;
        }
        .ps-user-name { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
        .ps-user-role { font-size: 12px; color: var(--text-muted); }

        /* Sync card */
        .ps-sync-card {
          display: flex; align-items: center; gap: 12px; margin: 12px 20px;
          padding: 14px 16px; border-radius: var(--radius-sm);
          background: var(--bg-card); border: 1px solid var(--border);
        }
        .ps-sync-card.ps-sync-connected {
          background: var(--accent-glow); border-color: rgba(76,158,235,0.15);
        }
        .ps-sync-icon-area { flex-shrink: 0; }
        .ps-sync-pulse {
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--success); box-shadow: 0 0 8px var(--success);
          animation: psPulse 2s infinite;
        }
        @keyframes psPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .ps-sync-title { font-size: 13px; font-weight: 700; color: var(--accent-bright); }
        .ps-sync-card:not(.ps-sync-connected) .ps-sync-title { color: var(--text-secondary); }
        .ps-sync-sub { font-size: 10px; color: var(--accent-dim); font-family: var(--mono); margin-top: 1px; }
        .ps-sync-card:not(.ps-sync-connected) .ps-sync-sub { color: var(--text-muted); }

        /* Menu */
        .ps-menu { padding: 4px 12px; }
        .ps-menu-item {
          display: flex; align-items: center; gap: 12px; padding: 14px 12px; width: 100%;
          border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; font-weight: 600;
          color: var(--text-secondary); -webkit-tap-highlight-color: transparent;
          background: none; border: none; font-family: var(--font); text-align: left;
        }
        .ps-menu-item:active { background: var(--bg-hover); }

        .ps-menu-icon {
          width: 36px; height: 36px; border-radius: var(--radius-xs);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ps-menu-icon svg { width: 18px; height: 18px; }
        .ps-menu-icon-settings { background: var(--purple-muted); color: var(--purple); }
        .ps-menu-icon-logout { background: var(--danger-muted); color: var(--danger); }
        .ps-menu-label { flex: 1; }
        .ps-menu-chevron { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
        .ps-menu-divider { height: 1px; background: var(--border); margin: 4px 12px; }
        .ps-menu-item-danger { color: var(--danger); }

        /* Only show on mobile */
        @media (max-width: 768px) {
          .ps-overlay { display: block; }
          .ps-sheet { display: block; }
        }
      `}</style>
    </>
  );
}