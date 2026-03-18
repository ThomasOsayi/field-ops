'use client';

interface TopbarProps {
  onNewJob: () => void;
}

export default function Topbar({ onNewJob }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '16px 32px',
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          Active Jobs
        </h1>

        {/* Search */}
        <div
          className="search-box-wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '320px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            transition: 'border-color 0.2s',
          }}
          onFocusCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-focus)')
          }
          onBlurCapture={(e) =>
            ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: '16px', height: '16px', flexShrink: 0, color: 'var(--text-muted)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs, companies, contacts…"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font)',
              fontSize: '13px',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Export button */}
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: '16px', height: '16px' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export
        </button>

        {/* New Job button */}
        <button
          onClick={onNewJob}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: 'var(--gradient-accent)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 16px rgba(76,158,235,0.3)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 6px 24px rgba(76,158,235,0.4)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.boxShadow =
              '0 4px 16px rgba(76,158,235,0.3)')
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ width: '16px', height: '16px' }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Job
        </button>
      </div>
    </header>
  );
}