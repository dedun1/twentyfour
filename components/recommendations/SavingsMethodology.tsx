'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Recommendation } from '@/lib/agents/types';
import type { SavingsBreakdown } from '@/lib/recommendations/computeSavings';
import { formatCurrency, formatHours } from '@/lib/recommendations/computeSavings';
import { cn } from '@/lib/utils';

type Props = {
  savings: SavingsBreakdown;
  recommendations: Recommendation[];
};

export function SavingsMethodology({ savings, recommendations }: Props) {
  const [open, setOpen] = useState(false);
  const recs = recommendations.filter(
    (r) => typeof r?.time_saved_hours_per_month === 'number' && r.time_saved_hours_per_month > 0,
  );

  return (
    <div className="pt-2 border-t border-border/60 mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center gap-2 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2"
        aria-expanded={open}
      >
        <span>How is this calculated?</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="mt-4 space-y-6 text-left text-sm max-w-xl mx-auto">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">1. Where the hours come from</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Each recommendation in your plan has a monthly hour estimate based on what you shared in the consultation.
              We add them together.
            </p>
            <ul className="space-y-1.5 text-xs border border-border/60 rounded-lg p-3 bg-muted/20">
              {recs.map((rec) => (
                <li key={rec.title} className="flex justify-between gap-3">
                  <span className="text-foreground min-w-0 truncate">{rec.title}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {formatHours(rec.time_saved_hours_per_month)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-3 pt-2 mt-2 border-t border-border/60 font-medium">
                <span className="text-foreground">Total hours saved per month</span>
                <span className="text-foreground tabular-nums">{formatHours(savings.monthlyHoursSaved)}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">2. How we value each hour</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {savings.method === 'real_team_cost'
                ? 'We used your actual team cost from the consultation, divided by team size and standard working hours.'
                : 'We used a conservative blend of operator and admin hourly rates for your industry, weighted 80% admin and 20% operator since most automation replaces support work.'}
            </p>
            <p className="text-xs text-foreground">
              Hourly value used: {formatCurrency(savings.hourlyRateUsed)} per hour
            </p>
            <p className="text-xs text-muted-foreground">{savings.methodLabel}</p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-foreground">3. The math</p>
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              {formatHours(savings.monthlyHoursSaved)} × ${savings.hourlyRateUsed}/hr ={' '}
              {formatCurrency(savings.monthlyDollarsSaved)}/month
            </p>
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              {formatCurrency(savings.monthlyDollarsSaved)}/month × 12 = {formatCurrency(savings.annualDollarsSaved)}
              /year
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/60 pt-4">
            These are estimates from your conversation, not generic stats. Your discovery call confirms exact numbers
            based on your specific situation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
