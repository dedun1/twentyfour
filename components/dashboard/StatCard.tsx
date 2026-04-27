'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: string;
}

export function StatCard({ label, value, icon, change, changeType = 'neutral', color = '#f0a500' }: StatCardProps) {
  const changeIcon =
    changeType === 'up' ? <TrendingUp size={12} /> :
    changeType === 'down' ? <TrendingDown size={12} /> :
    <Minus size={12} />;

  const changeColor =
    changeType === 'up' ? '#22c55e' :
    changeType === 'down' ? '#ef4444' :
    '#9ca3af';

  return (
    <div className="glass-card p-5 flex flex-col gap-4 transition-all duration-300 hover:border-[rgba(240,165,0,0.25)]">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--muted-fg)]">{label}</p>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-[var(--foreground)]">{value}</p>
        {change && (
          <div className="flex items-center gap-1 mt-1.5">
            <span style={{ color: changeColor }}>{changeIcon}</span>
            <span className="text-xs font-medium" style={{ color: changeColor }}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
