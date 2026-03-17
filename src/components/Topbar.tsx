'use client';

interface TopbarProps {
  onNewJob: () => void;
}

export default function Topbar({ onNewJob }: TopbarProps) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-5">
        <h1 className="text-xl font-extrabold tracking-tight">Active Jobs</h1>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-[14px] py-2 rounded-[10px] w-80 transition-all duration-200"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
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
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs, companies, contacts…"
            className="bg-transparent border-none outline-none text-[13px] w-full"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-dm-sans)',
            }}
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-[10px]">
        {/* Export button */}
        <button
          className="flex items-center gap-[7px] px-4 py-[9px] rounded-[10px] text-[13px] font-bold cursor-pointer transition-all duration-150"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-dm-sans)',
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
            className="w-4 h-4"
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
          className="flex items-center gap-[7px] px-4 py-[9px] rounded-[10px] text-[13px] font-bold text-white cursor-pointer transition-all duration-150"
          style={{
            background: 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
            boxShadow: '0 4px 16px rgba(76,158,235,0.3)',
            border: 'none',
            fontFamily: 'var(--font-dm-sans)',
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
            className="w-4 h-4"
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