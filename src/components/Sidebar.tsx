'use client';

import { useState } from 'react';

const navMain = [
  {
    label: 'Jobs',
    badge: '24',
    active: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    label: 'Contacts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Documents',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    label: 'Notifications',
    dot: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
];

const navSettings = [
  {
    label: 'Integrations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [active, setActive] = useState('Jobs');

  return (
    <nav
      className="fixed top-0 left-0 bottom-0 z-[100] flex flex-col"
      style={{
        width: '260px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-5 py-[22px]"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-sm font-extrabold"
          style={{
            background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
            boxShadow: '0 4px 16px rgba(76,158,235,0.3)',
            fontFamily: 'var(--font-jetbrains-mono)',
          }}
        >
          FO
        </div>
        <div>
          <div className="font-extrabold text-[17px] tracking-tight">
            <span
              style={{
                background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              FieldOps
            </span>
          </div>
          <div
            className="text-[11px] font-medium"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            v1.0
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-[14px]">
        <div
          className="text-[10px] font-bold uppercase tracking-[0.08em] px-[10px] pt-4 pb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Main
        </div>

        {navMain.map((item) => {
          const isActive = active === item.label;
          return (
            <div
              key={item.label}
              onClick={() => setActive(item.label)}
              className="relative flex items-center gap-[10px] px-3 py-[9px] rounded-[10px] mb-[2px] cursor-pointer text-sm font-semibold transition-all duration-150"
              style={{
                color: isActive ? 'var(--accent-bright)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-glow-strong)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
                  (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-[3px]"
                  style={{ background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)' }}
                />
              )}
              {item.icon}
              {item.label}
              {item.badge && (
                <span
                  className="ml-auto text-[11px] font-bold px-2 py-[2px] rounded-[10px]"
                  style={{
                    background: 'var(--accent-glow)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-jetbrains-mono)',
                  }}
                >
                  {item.badge}
                </span>
              )}
              {item.dot && (
                <span
                  className="ml-auto w-[7px] h-[7px] rounded-full"
                  style={{ background: 'var(--danger)' }}
                />
              )}
            </div>
          );
        })}

        <div
          className="text-[10px] font-bold uppercase tracking-[0.08em] px-[10px] pt-4 pb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Settings
        </div>

        {navSettings.map((item) => (
          <div
            key={item.label}
            onClick={() => setActive(item.label)}
            className="flex items-center gap-[10px] px-3 py-[9px] rounded-[10px] mb-[2px] cursor-pointer text-sm font-semibold transition-all duration-150"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)';
              (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
            }}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-[14px]" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Outlook sync status */}
        <div
          className="flex items-center gap-[10px] px-[14px] py-3 rounded-[10px] mb-2"
          style={{
            background: 'var(--accent-glow)',
            border: '1px solid rgba(76,158,235,0.15)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
              animation: 'pulse 2s infinite',
            }}
          />
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--accent-bright)' }}>
              Outlook Synced
            </div>
            <div
              className="text-[10px]"
              style={{ color: 'var(--accent-dim)', fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              Last: 2m ago
            </div>
          </div>
        </div>

        {/* User */}
        <div
          className="flex items-center gap-[10px] px-[14px] py-3 rounded-[10px] cursor-pointer transition-all duration-150"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
          }
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)' }}
          >
            TO
          </div>
          <div>
            <div className="text-[13px] font-semibold">Thomas Osayi</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Admin</div>
          </div>
        </div>
      </div>
    </nav>
  );
}