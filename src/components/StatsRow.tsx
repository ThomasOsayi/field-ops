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
      color: 'blue',
      topColor: 'linear-gradient(135deg, #4C9EEB, #7B61FF)',
      iconBg: 'var(--accent-glow)',
      iconColor: 'var(--accent)',
      label: 'Active Jobs',
      value: active,
      valueColor: 'var(--text-primary)',
      delta: '↑ 3 from last week',
      deltaType: 'up',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      color: 'yellow',
      topColor: 'var(--warning)',
      iconBg: 'var(--warning-muted)',
      iconColor: 'var(--warning)',
      label: 'Scheduled Today',
      value: scheduledToday,
      valueColor: 'var(--warning)',
      delta: 'Next at 10:30 AM',
      deltaType: 'neutral',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      color: 'purple',
      topColor: 'var(--purple)',
      iconBg: 'var(--purple-muted)',
      iconColor: 'var(--purple)',
      label: 'In Progress',
      value: inProgress,
      valueColor: 'var(--purple)',
      delta: '2 nearing KTI',
      deltaType: 'down',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
    {
      color: 'green',
      topColor: 'var(--success)',
      iconBg: 'var(--success-muted)',
      iconColor: 'var(--success)',
      label: 'Completed (Week)',
      value: completedWeek,
      valueColor: 'var(--success)',
      delta: '↑ 12% vs last week',
      deltaType: 'up',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
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
    <div className="grid grid-cols-4 gap-[14px] mb-7">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-[14px] px-5 py-[18px] transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            animation: `fadeUp 0.4s ease forwards`,
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
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: s.topColor }}
          />

          {/* Icon + Label */}
          <div className="flex items-center justify-between mb-[10px]">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center"
              style={{ background: s.iconBg, color: s.iconColor }}
            >
              {s.icon}
            </div>
            <div
              className="text-[12px] font-semibold uppercase tracking-[0.04em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {s.label}
            </div>
          </div>

          {/* Value */}
          <div
            className="text-[32px] font-bold tracking-tight mb-1"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
              color: s.valueColor,
            }}
          >
            {s.value}
          </div>

          {/* Delta */}
          <div
            className="text-[12px] font-medium"
            style={{
              fontFamily: 'var(--font-jetbrains-mono)',
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