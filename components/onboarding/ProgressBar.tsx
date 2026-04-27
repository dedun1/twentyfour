'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const { lang } = useLanguage();
  const t = useT(lang);
  const pct = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--muted-fg)]">
          {t.onboarding.step} {current} {t.onboarding.of} {total}
        </span>
        <span className="text-xs font-bold text-[var(--primary)]">{pct}%</span>
      </div>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ background: 'rgba(31,41,55,0.8)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #f0a500, #ffd700)',
          }}
        />
      </div>
    </div>
  );
}
