'use client';

import { Zap } from 'lucide-react';
import { IntakeChat } from '@/components/onboarding/IntakeChat';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import Link from 'next/link';

export default function OnboardingPage() {
  const { lang } = useLanguage();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(240,165,0,0.08) 0%, var(--bg) 60%)',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-3"
        style={{ borderBottom: '1px solid rgba(240,165,0,0.08)' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}
          >
            <Zap size={16} className="text-[#0a0f1e]" />
          </div>
          <span className="font-extrabold" style={{ color: '#f0a500' }}>TwentyFour</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/dashboard" className="btn-ghost text-xs py-1.5 px-3">
            {lang === 'ar' ? 'تخطي' : 'Skip'}
          </Link>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl h-[70vh] glass-card overflow-hidden flex flex-col"
          style={{ minHeight: '500px' }}
        >
          <IntakeChat />
        </div>
      </div>
    </div>
  );
}
