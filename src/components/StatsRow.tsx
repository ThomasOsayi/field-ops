'use client';

import { Job } from '@/types/job';

interface StatsRowProps {
  jobs: Job[];
}

export default function StatsRow({ jobs }: StatsRowProps) {
  const active = jobs.filter((j) => j.status !== 'completed').length;
  const scheduledToday = jobs.filter((j) => j.status === 'scheduled').length;
  const inProgress = jobs.filter((j) => j.status === 'in-progress').length;
  const completedWeek = jobs.filter((j) => j.status === 'completed').length;

  const stats = [
    {
      topColor: 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
      iconBg: 'var(--accent-glow)',
      iconColor: 'var(--accent)',
      label: 'Active Jobs',
      value: active,
      valueColor: 'var(--text-primary)',
      delta: '↑ 3 from last week',
      deltaType: 'up' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      topColor: 'var(--warning)',
      iconBg: 'var(--warning-muted)',
      iconColor: 'var(--warning)',
      label: 'Scheduled Today',
      value: scheduledToday,
      valueColor: 'var(--warning)',
      delta: 'Next at 10:30 AM',
      deltaType: 'neutral' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      topColor: 'var(--purple)',
      iconBg: 'var(--purple-muted)',
      iconColor: 'var(--purple)',
      label: 'In Progress',
      value: inProgress,
      valueColor: 'var(--purple)',
      delta: '2 nearing KTI',
      deltaType: 'down' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      topColor: 'var(--success)',
      iconBg: 'var(--success-muted)',
      iconColor: 'var(--success)',
      label: 'Completed (Week)',
      value: completedWeek,
      valueColor: 'var(--success)',
      delta: '↑ 12% vs last week',
      deltaType: 'up' as const,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
  ];

  const deltaColor = (type: string) => {
    if (type === 'up') return 'var(--success)';
    if (type === 'down') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius)',
            padding: '18px 20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            transition: 'all 0.2s',
            animation: 'fadeUp 0.4s ease forwards',
            animationDelay: `${(i + 1) * 0.05}s`,
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)';
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card)';
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: s.topColor,
            }}
          />

          {/* Icon + Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: s.iconBg,
                color: s.iconColor,
              }}
            >
              {s.icon}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
              }}
            >
              {s.label}
            </div>
          </div>

          {/* Value */}
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: s.valueColor,
              marginBottom: '4px',
            }}
          >
            {s.value}
          </div>

          {/* Delta */}
          <div
            style={{
              fontSize: '12px',
              fontFamily: 'var(--mono)',
              fontWeight: 500,
              color: deltaColor(s.deltaType),
            }}
          >
            {s.delta}
          </div>
        </div>
      ))}
    </div>
  );
}