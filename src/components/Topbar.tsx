'use client';

interface TopbarProps {
  onNewJob: () => void;
  onSearch?: (query: string) => void;
  onExport?: () => void;
  buttonLabel?: string;
}

export default function Topbar({ onNewJob, onSearch, onExport, buttonLabel }: TopbarProps) {
  return (
    <>
      <header className="topbar">
        {/* ── Row 1: Title + actions ── */}
        <div className="topbar-row">
          <div className="topbar-left">
            {/* Mobile brand mark — hidden on desktop */}
            <div className="topbar-brand-mobile">
              <div className="topbar-brand-mark">FO</div>
            </div>
            <h1 className="topbar-title">Active Jobs</h1>
            {/* Desktop search — hidden on mobile */}
            <div className="topbar-search-desktop">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="topbar-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search jobs, companies, contacts…"
                onChange={e => onSearch?.(e.target.value)}
                className="topbar-search-input"
              />
            </div>
          </div>
          <div className="topbar-right">
            {/* Export — desktop only */}
            {onExport && (
              <button onClick={onExport} className="topbar-btn-ghost topbar-export-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
            )}
            {/* New Job */}
            {buttonLabel !== '' && (
              <button onClick={onNewJob} className="topbar-btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span className="topbar-btn-label-full">{buttonLabel || 'New Job'}</span>
                <span className="topbar-btn-label-short">New</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Row 2: Mobile search — hidden on desktop ── */}
        <div className="topbar-search-mobile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="topbar-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search jobs, companies…"
            onChange={e => onSearch?.(e.target.value)}
            className="topbar-search-input"
          />
        </div>
      </header>

      <style>{`
        /* ═══ TOPBAR — DESKTOP ═══ */
        .topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg-sidebar);
          border-bottom: 1px solid var(--border);
          padding: 16px 32px;
        }

        .topbar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .topbar-title {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
          white-space: nowrap;
        }

        /* Desktop search */
        .topbar-search-desktop {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 320px;
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          background: var(--bg-input);
          border: 1px solid var(--border);
          transition: border-color 0.2s;
        }
        .topbar-search-desktop:focus-within {
          border-color: var(--border-focus);
        }

        .topbar-search-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          color: var(--text-muted);
        }

        .topbar-search-input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-family: var(--font);
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        /* Mobile search — hidden on desktop */
        .topbar-search-mobile {
          display: none;
        }

        /* Mobile brand mark — hidden on desktop */
        .topbar-brand-mobile {
          display: none;
        }

        .topbar-brand-mark {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: linear-gradient(135deg, #4C9EEB, #7B61FF);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--mono);
          font-weight: 800;
          font-size: 10px;
          color: #fff;
          flex-shrink: 0;
        }

        /* Buttons */
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: var(--bg-card);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          transition: all 0.15s;
        }
        .topbar-btn-ghost:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .topbar-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          border-radius: var(--radius-sm);
          font-family: var(--font);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          background: var(--gradient-accent);
          color: #fff;
          border: none;
          box-shadow: 0 4px 16px rgba(76,158,235,0.3);
          transition: all 0.15s;
        }
        .topbar-btn-primary:hover {
          box-shadow: 0 6px 24px rgba(76,158,235,0.4);
        }
        .topbar-btn-primary:active {
          transform: scale(0.97);
        }

        /* Label toggle: full on desktop, short on mobile */
        .topbar-btn-label-short {
          display: none;
        }

        /* ═══ TABLET — ≤1024px ═══ */
        @media (max-width: 1024px) {
          .topbar-search-desktop {
            width: 240px;
          }
        }

        /* ═══ MOBILE — ≤768px ═══ */
        @media (max-width: 768px) {
          .topbar {
            padding: 12px 16px;
          }

          /* Show mobile brand mark */
          .topbar-brand-mobile {
            display: flex;
          }

          .topbar-left {
            gap: 10px;
          }

          .topbar-title {
            font-size: 16px;
          }

          /* Hide desktop search */
          .topbar-search-desktop {
            display: none;
          }

          /* Show mobile search below the title row */
          .topbar-search-mobile {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            padding: 10px 12px;
            border-radius: var(--radius-sm);
            background: var(--bg-input);
            border: 1px solid var(--border);
            transition: border-color 0.2s;
          }
          .topbar-search-mobile:focus-within {
            border-color: var(--border-focus);
          }
          .topbar-search-mobile .topbar-search-input {
            font-size: 14px;
          }

          /* Hide export on mobile */
          .topbar-export-btn {
            display: none;
          }

          /* Compact primary button: "New" instead of "New Job" */
          .topbar-btn-primary {
            padding: 0 14px;
            height: 36px;
            font-size: 12px;
            gap: 5px;
          }
          .topbar-btn-primary svg {
            width: 14px !important;
            height: 14px !important;
          }

          .topbar-btn-label-full {
            display: none;
          }
          .topbar-btn-label-short {
            display: inline;
          }
        }

        /* ═══ SMALL MOBILE — ≤390px ═══ */
        @media (max-width: 390px) {
          .topbar {
            padding: 10px 12px;
          }
          .topbar-title {
            font-size: 15px;
          }
        }
      `}</style>
    </>
  );
}