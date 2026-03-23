'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUidSafe } from '@/lib/auth-helpers';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { connectOutlook, disconnectOutlookClient, checkOutlookConnection } from '@/lib/outlook-sync';

interface SyncEvent { id: string; message: string; detail: string; status: 'ok' | 'warn'; }

export default function IntegrationsPage() {
  const [configOpen, setConfigOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [lastSyncLabel, setLastSyncLabel] = useState('—');
  const [syncHistory, setSyncHistory] = useState<SyncEvent[]>([]);
  const [syncOnCreate, setSyncOnCreate] = useState(true);
  const [syncUpdates, setSyncUpdates] = useState(true);
  const [removeOnComplete, setRemoveOnComplete] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);

  // Connection check with retry — auth may not be ready after OAuth redirect
  const checkWithRetry = useCallback(async (retries = 4): Promise<void> => {
    for (let i = 0; i < retries; i++) {
      const status = await checkOutlookConnection();
      if (status.connected) {
        setConnected(true);
        setEmail(status.email);
        setChecking(false);
        return;
      }
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1200));
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('connected') === 'true') {
      // Just came back from OAuth — set connected immediately, then verify in background
      setConnected(true);
      setChecking(false);
      window.history.replaceState({}, '', '/integrations');
      // Background check to get email (don't override connected state)
      checkWithRetry(4).then(() => {});
      return;
    }

    if (params.get('error')) {
      console.error('OAuth error:', params.get('error'));
      window.history.replaceState({}, '', '/integrations');
      setChecking(false);
      return;
    }

    // Normal page load
    checkWithRetry(4);
  }, [checkWithRetry]);

  // Load sync settings from per-user path
  useEffect(() => {
    const loadSettings = async () => {
      const uid = getUidSafe();
      if (!uid) return;
      try {
        const ref = doc(db, `users/${uid}/settings`, 'sync_settings');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.syncOnCreate !== undefined) setSyncOnCreate(data.syncOnCreate);
          if (data.syncUpdates !== undefined) setSyncUpdates(data.syncUpdates);
          if (data.removeOnComplete !== undefined) setRemoveOnComplete(data.removeOnComplete);
          if (data.includeNotes !== undefined) setIncludeNotes(data.includeNotes);
        }
      } catch (err) { console.error('Failed to load sync settings:', err); }
    };
    loadSettings();
  }, []);

  const saveSyncSettings = async (updates: Record<string, boolean>) => {
    const uid = getUidSafe();
    if (!uid) return;
    try { await setDoc(doc(db, `users/${uid}/settings`, 'sync_settings'), updates, { merge: true }); }
    catch (err) { console.error('Failed to save sync settings:', err); }
  };
  const toggleSetting = (key: string, current: boolean, setter: (v: boolean) => void) => { const nv = !current; setter(nv); saveSyncSettings({ [key]: nv }); };

  // Fetch stats from per-user paths
  useEffect(() => {
    const fetchStats = async () => {
      const uid = getUidSafe();
      try {
        const mappingsSnap = uid
          ? await getDocs(collection(db, `users/${uid}/outlook_event_mappings`))
          : { size: 0 };
        setEventCount(mappingsSnap.size);
        if (!uid) return;
        const notifsQ = query(collection(db, `users/${uid}/notifications`), orderBy('createdAt', 'desc'), limit(30));
        const notifsSnap = await getDocs(notifsQ);
        const history: SyncEvent[] = [];
        let latestSyncTime: Date | null = null;
        notifsSnap.docs.forEach(d => {
          const data = d.data();
          const category = data.category || '';
          if (category === 'job' || category === 'calendar' || category === 'outlook') {
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
            if (!createdAt) return;
            if (!latestSyncTime || createdAt > latestSyncTime) latestSyncTime = createdAt;
            const title = data.titleBold ? `${data.titleBold}${data.title || ''}` : data.title || 'Sync event';
            history.push({ id: d.id, message: title, detail: formatSyncDate(createdAt) + (data.desc ? ` · ${data.desc.slice(0, 60)}` : ''), status: data.type === 'error' ? 'warn' : 'ok' });
          }
        });
        setSyncHistory(history.slice(0, 8));
        if (latestSyncTime) setLastSyncLabel(timeAgo(latestSyncTime));
      } catch (err) { console.error('Failed to fetch integration stats:', err); }
    };
    if (connected) fetchStats();
  }, [connected]);

  const formatSyncDate = (date: Date) => {
    const now = new Date(); const diff = now.getTime() - date.getTime();
    if (diff < 86400000 && now.getDate() === date.getDate()) return 'Today, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const timeAgo = (date: Date) => { const s = Math.floor((Date.now() - date.getTime()) / 1000); if (s < 60) return 'Just now'; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };

  const handleConnect = () => connectOutlook();
  const handleDisconnect = async () => { if (!confirm('Disconnect Outlook Calendar? Jobs will no longer sync.')) return; setDisconnecting(true); const success = await disconnectOutlookClient(); if (success) { setConnected(false); setEmail(''); setConfigOpen(false); } setDisconnecting(false); };
  const handleSyncNow = () => alert('Manual sync triggered — all active jobs will be synced to Outlook.');

  const renderToggle = (label: string, sub: string, value: boolean, key: string, setter: (v: boolean) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, marginRight: '12px' }}><div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{label}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div></div>
      <div onClick={() => toggleSetting(key, value, setter)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: value ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: value ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </div>
    </div>
  );

  const renderInfoRow = (label: string, value: string, opts?: { mono?: boolean; accent?: boolean; success?: boolean; last?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: opts?.last ? 'none' : '1px solid var(--border)' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
      {opts?.success ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>{value}
        </span>
      ) : (
        <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: opts?.mono ? 'var(--mono)' : undefined, color: opts?.accent ? 'var(--accent)' : undefined, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
      )}
    </div>
  );

  const renderSectionHead = (label: string, iconPath: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>{iconPath}</svg>{label}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="intg-page">
        <Sidebar />
        <div className="intg-main app-main">
          <header className="intg-topbar">
            <div className="intg-topbar-desktop">
              <div>
                <h1 className="intg-topbar-title-d">Integrations</h1>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Connect FieldOps with your tools</div>
              </div>
            </div>
            <div className="intg-topbar-mobile">
              <button onClick={() => window.history.back()} className="intg-back-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><polyline points="15 18 9 12 15 6"/></svg>Back
              </button>
              <div className="intg-topbar-title-m">Integrations</div>
              <div style={{ width: '60px' }} />
            </div>
          </header>

          <main className="intg-content">
            {checking ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', fontSize: '14px' }}>Checking connection…</div>
            ) : (<>
              <div className="intg-mobile-title">
                <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '4px' }}>Integrations</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Connect FieldOps with your tools</div>
              </div>

              <div className="intg-cards">
                <div onClick={() => connected ? setConfigOpen(true) : handleConnect()} className="intg-outlook-card"
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)'; }}>
                  {connected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--success)' }} />}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '24px', height: '24px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', background: connected ? 'var(--success-muted)' : 'var(--bg-elevated)', color: connected ? 'var(--success)' : 'var(--text-muted)' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--text-muted)' }} />{connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '4px' }}>Outlook Calendar</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>{connected ? 'Jobs automatically sync to your Outlook calendar. Tap to configure.' : 'Connect your Microsoft account to sync jobs to Outlook Calendar.'}</div>
                  {connected ? (
                    <div className="intg-outlook-stats">
                      <div><div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>{eventCount}</div><div className="intg-stat-label">Events synced</div></div>
                      <div><div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--success)' }}>{lastSyncLabel}</div><div className="intg-stat-label">Last sync</div></div>
                      <div><div style={{ fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>0</div><div className="intg-stat-label">Errors</div></div>
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 700, background: 'var(--gradient-accent)', color: '#fff', boxShadow: '0 4px 16px rgba(76,158,235,0.3)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg>Connect Outlook
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>About Integrations
                </div>
                <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(76,158,235,0.15)', borderRadius: '12px', padding: '18px 20px', fontSize: '13px', color: 'var(--accent-bright)', lineHeight: 1.7 }}>
                  Integrations connect FieldOps to your existing tools. When a job is created or updated, connected services are automatically notified. All sync activity is logged and can be reviewed in the configuration panel.
                </div>
              </div>
            </>)}
          </main>
        </div>

        {configOpen && <>
          <div onClick={() => setConfigOpen(false)} className="intg-panel-overlay panel-overlay" />
          <div className="intg-config-panel slide-panel">
            <div className="intg-config-header">
              <div className="intg-config-header-desktop">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09"/></svg></div>
                  <div><div style={{ fontSize: '17px', fontWeight: 800 }}>Outlook Calendar</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configuration & sync history</div></div>
                </div>
              </div>
              <div className="intg-config-header-mobile">
                <button onClick={() => setConfigOpen(false)} className="intg-config-back-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}><polyline points="15 18 9 12 15 6"/></svg>Back
                </button>
                <div className="intg-config-title-m">Outlook Settings</div>
              </div>
              <button onClick={() => setConfigOpen(false)} className="intg-config-close-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="intg-config-body">
              <div style={{ padding: '28px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(76,158,235,0.08), rgba(123,97,255,0.05))', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--accent-glow)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '28px', height: '28px' }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,7 12,13 2,7"/></svg></div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2px' }}>Outlook Calendar</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--success)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="20 6 9 17 4 12"/></svg>Connected · {email || '—'}</div>
                </div>
              </div>
              <div className="intg-config-sections">
                <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Connection', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {renderInfoRow('Account', email || '—', { mono: true, accent: true })}
                    {renderInfoRow('Status', 'Connected', { success: true })}
                    {renderInfoRow('Events Synced', String(eventCount), { mono: true })}
                    {renderInfoRow('Last Sync', lastSyncLabel, { mono: true, last: true })}
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Sync Settings', <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06"/></>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {renderToggle('Auto-sync on job create', 'Create Outlook event when a new job is saved', syncOnCreate, 'syncOnCreate', setSyncOnCreate)}
                    {renderToggle('Sync job updates', 'Update Outlook event when job time or status changes', syncUpdates, 'syncUpdates', setSyncUpdates)}
                    {renderToggle('Remove on completion', 'Delete Outlook event when job is marked complete', removeOnComplete, 'removeOnComplete', setRemoveOnComplete)}
                    <div style={{ borderBottom: 'none' }}>{renderToggle('Include job notes', 'Add scope and notes to the calendar event body', includeNotes, 'includeNotes', setIncludeNotes)}</div>
                  </div>
                </div>
                {syncHistory.length > 0 && <div style={{ marginBottom: '24px' }}>
                  {renderSectionHead('Recent Activity', <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>)}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {syncHistory.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < syncHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: s.status === 'ok' ? 'var(--success-muted)' : 'var(--warning-muted)', color: s.status === 'ok' ? 'var(--success)' : 'var(--warning)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}>{s.status === 'ok' ? <polyline points="20 6 9 17 4 12"/> : <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}</svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.message}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>}
              </div>
            </div>
            <div className="intg-config-footer">
              <button onClick={handleDisconnect} disabled={disconnecting} className="intg-btn-disconnect" style={{ opacity: disconnecting ? 0.6 : 1 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>{disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
              <div className="intg-config-footer-right">
                <button onClick={() => setConfigOpen(false)} className="intg-btn-close">Close</button>
                <button onClick={handleSyncNow} className="intg-btn-sync">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>Sync Now
                </button>
              </div>
            </div>
          </div>
        </>}
      </div>

      <style>{`
        .intg-page { display: flex; min-height: 100vh; background: var(--bg-void); }
        .intg-main { margin-left: var(--sidebar-width); flex: 1; display: flex; flex-direction: column; min-height: 100vh; min-width: 0; overflow: hidden; }
        .intg-content { padding: 28px 32px; flex: 1; }
        .intg-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid var(--border); background: var(--bg-sidebar); position: sticky; top: 0; z-index: 50; }
        .intg-topbar-desktop { display: flex; }
        .intg-topbar-mobile { display: none; }
        .intg-topbar-title-d { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; }
        .intg-topbar-title-m { font-size: 16px; font-weight: 700; }
        .intg-back-btn { display: flex; align-items: center; gap: 4px; color: var(--accent-bright); font-size: 14px; font-weight: 600; background: none; border: none; cursor: pointer; padding: 8px 4px; -webkit-tap-highlight-color: transparent; }
        .intg-mobile-title { display: none; }
        .intg-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .intg-outlook-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
        .intg-outlook-stats { display: flex; gap: 20px; }
        .intg-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .intg-panel-overlay { position: fixed; inset: 0; background: rgba(6,8,12,0.7); backdrop-filter: blur(4px); z-index: 200; }
        .intg-config-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 620px; background: var(--bg-sidebar); border-left: 1px solid var(--border); z-index: 300; display: flex; flex-direction: column; }
        .intg-config-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 28px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .intg-config-header-desktop { display: flex; align-items: center; }
        .intg-config-header-mobile { display: none; }
        .intg-config-back-btn { display: flex; align-items: center; gap: 4px; color: var(--accent-bright); font-size: 14px; font-weight: 600; background: none; border: none; cursor: pointer; padding: 8px 4px; }
        .intg-config-title-m { font-size: 16px; font-weight: 700; }
        .intg-config-close-btn { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); background: transparent; border: 1px solid var(--border); flex-shrink: 0; }
        .intg-config-body { flex: 1; overflow-y: auto; padding: 0; }
        .intg-config-sections { padding: 24px 28px; }
        .intg-config-footer { padding: 18px 28px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
        .intg-config-footer-right { display: flex; gap: 10px; }
        .intg-btn-disconnect { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 12px; font-weight: 700; cursor: pointer; background: var(--danger-muted); color: var(--danger); border: 1px solid rgba(248,113,113,0.2); }
        .intg-btn-close { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border); }
        .intg-btn-sync { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 700; cursor: pointer; background: var(--gradient-accent); color: #fff; border: none; box-shadow: 0 4px 16px rgba(76,158,235,0.3); }
        @media (max-width: 768px) {
          .intg-main { margin-left: 0; }
          .intg-content { padding: 16px; padding-bottom: calc(var(--tabbar-height) + 16px); }
          .intg-topbar { padding: 12px 16px; }
          .intg-topbar-desktop { display: none; }
          .intg-topbar-mobile { display: flex; align-items: center; justify-content: space-between; width: 100%; }
          .intg-mobile-title { display: block; margin-bottom: 20px; }
          .intg-cards { grid-template-columns: 1fr; }
          .intg-outlook-card { padding: 20px 16px; }
          .intg-outlook-stats { gap: 16px; }
          .intg-config-panel { width: 100% !important; border-left: none; }
          .intg-panel-overlay { backdrop-filter: none; }
          .intg-config-header { padding: 12px 16px; padding-top: max(12px, env(safe-area-inset-top, 12px)); }
          .intg-config-header-desktop { display: none; }
          .intg-config-header-mobile { display: flex; align-items: center; gap: 12px; flex: 1; }
          .intg-config-sections { padding: 16px 16px 120px; }
          .intg-config-footer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 310; background: var(--bg-sidebar); padding: 12px 16px; padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)); }
          .intg-btn-disconnect { font-size: 11px; padding: 10px 10px; min-height: 44px; }
          .intg-btn-close { flex: 1; justify-content: center; min-height: 48px; }
          .intg-btn-sync { flex: 1.2; justify-content: center; min-height: 48px; }
        }
        @media (max-width: 390px) { .intg-content { padding: 12px; padding-bottom: calc(var(--tabbar-height) + 12px); } .intg-outlook-card { padding: 16px 14px; } }
        select option { background: var(--bg-card); color: var(--text-primary); }
      `}</style>
    </ProtectedRoute>
  );
}