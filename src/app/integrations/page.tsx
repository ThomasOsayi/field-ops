'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

/* ── Sync history data ── */
interface SyncEvent {
  id: string;
  message: string;
  detail: string;
  status: 'ok' | 'warn';
}

const SYNC_HISTORY: SyncEvent[] = [
  { id: 's1', message: 'JOB-2401 synced to Outlook', detail: 'Today, 7:02 AM · Created event', status: 'ok' },
  { id: 's2', message: 'JOB-2400 updated in Outlook', detail: 'Today, 8:15 AM · Status → In Progress', status: 'ok' },
  { id: 's3', message: 'JOB-2399 removed from Outlook', detail: 'Yesterday, 4:31 PM · Marked complete', status: 'ok' },
  { id: 's4', message: 'JOB-2398 synced to Outlook', detail: 'Mar 15 · Created event', status: 'ok' },
  { id: 's5', message: 'Rate limit hit — retried successfully', detail: 'Mar 14 · Auto-retry after 5s', status: 'warn' },
];

export default function IntegrationsPage() {
  const [configOpen, setConfigOpen] = useState(false);

  const [syncOnCreate, setSyncOnCreate] = useState(true);
  const [syncUpdates, setSyncUpdates] = useState(true);
  const [removeOnComplete, setRemoveOnComplete] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);

  const renderToggle = (label: string, sub: string, value: boolean, onChange: () => void) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      <div
        onClick={onChange}
        style={{
          width: '40px', height: '22px', borderRadius: '11px',
          background: value ? 'var(--accent)' : 'var(--border)',
          cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '3px', left: value ? '21px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );

  const renderInfoRow = (label: string, value: string, opts?: { mono?: boolean; accent?: boolean; success?: boolean; last?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: opts?.last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      {opts?.success ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>
          {value}
        </span>
      ) : (
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: opts?.mono ? 'var(--mono)' : undefined, color: opts?.accent ? 'var(--accent)' : undefined }}>{value}</span>
      )}
    </div>
  );

  const renderSectionHead = (label: string, iconPath: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPath}</svg>
      {label}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <Sidebar />

      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-sidebar)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>Integrations</h1>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Connect FieldOps with your tools</div>
          </div>
        </header>

        <main style={{ padding: '28px 32px', flex: 1 }}>
          {/* Integration Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {/* Outlook Card */}
            <div
              onClick={() => setConfigOpen(true)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '24px',
                cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}
            >
              {/* Green top bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--success)' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', background: 'var(--success-muted)', color: 'var(--success)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
                  Connected
                </span>
              </div>

              <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>Outlook Calendar</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                Automatically sync jobs to your Outlook calendar. Events are created, updated, and removed as job schedules change.
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>47</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Events synced</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>2m ago</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Last sync</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>0</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Errors</div>
                </div>
              </div>
            </div>
          </div>

          {/* Info block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              About Integrations
            </div>
            <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(76,158,235,0.15)', borderRadius: '12px', padding: '18px 20px', fontSize: '13px', color: 'var(--accent-bright)', lineHeight: 1.7 }}>
              Integrations connect FieldOps to your existing tools. When a job is created or updated, connected services are automatically notified. All sync activity is logged and can be reviewed in the configuration panel for each integration.
            </div>
          </div>
        </main>
      </div>

      {/* ═══ CONFIG PANEL ═══ */}
      {configOpen && (
        <>
          <div onClick={() => setConfigOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,12,0.7)', backdropFilter: 'blur(4px)', zIndex: 200 }} />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '620px', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>Outlook Calendar</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configuration & sync history</div>
                </div>
              </div>
              <button onClick={() => setConfigOpen(false)} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              {/* Hero */}
              <div style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2px' }}>Outlook Calendar</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>
                    Connected · thomas@osayi.com
                  </div>
                </div>
              </div>

              <div style={{ padding: '24px 28px' }}>
                {/* Connection */}
                <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Connection', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {renderInfoRow('Account', 'thomas@osayi.com', { mono: true, accent: true })}
                    {renderInfoRow('Status', 'Connected', { success: true })}
                    {renderInfoRow('Connected Since', 'Jan 12, 2026', { mono: true })}
                    {renderInfoRow('Last Sync', '2 minutes ago', { mono: true, last: true })}
                  </div>
                </div>

                {/* Sync Settings */}
                <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Sync Settings', <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06"/></>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {renderToggle('Auto-sync on job create', 'Create Outlook event when a new job is saved', syncOnCreate, () => setSyncOnCreate(!syncOnCreate))}
                    {renderToggle('Sync job updates', 'Update Outlook event when job time or status changes', syncUpdates, () => setSyncUpdates(!syncUpdates))}
                    {renderToggle('Remove on completion', 'Delete Outlook event when job is marked complete', removeOnComplete, () => setRemoveOnComplete(!removeOnComplete))}
                    <div style={{ borderBottom: 'none' }}>
                      {renderToggle('Include job notes', 'Add scope and notes to the calendar event body', includeNotes, () => setIncludeNotes(!includeNotes))}
                    </div>
                  </div>
                </div>

                {/* Sync Statistics */}
                <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Sync Statistics', <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {renderInfoRow('Total Events Synced', '47', { mono: true, accent: true })}
                    {renderInfoRow('Events This Week', '8', { mono: true })}
                    {renderInfoRow('Failed Syncs', '0', { mono: true })}
                    {renderInfoRow('Avg Sync Time', '1.2s', { mono: true, last: true })}
                  </div>
                </div>

                {/* Sync History */}
                <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Recent Sync History', <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {SYNC_HISTORY.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < SYNC_HISTORY.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: s.status === 'ok' ? 'var(--success-muted)' : 'var(--warning-muted)',
                          color: s.status === 'ok' ? 'var(--success)' : 'var(--warning)',
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>
                            {s.status === 'ok'
                              ? <polyline points="20 6 9 17 4 12"/>
                              : <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                          </svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '1px', color: s.status === 'warn' ? 'var(--warning)' : undefined }}>{s.message}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{s.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '18px 28px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)', transition: 'all 0.15s' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                Disconnect
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfigOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', transition: 'all 0.15s' }}>Close</button>
                <button style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(76,158,235,0.3)', transition: 'all 0.15s' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Sync Now
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}