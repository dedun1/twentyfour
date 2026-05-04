'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function BookCallButton() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <Link
      href="/get-started"
      className="fixed bottom-6 right-6 z-40 btn-gold rounded-full px-5 py-3 text-sm shadow-lg glow-gold flex items-center gap-2"
      aria-label={isAr ? 'احصل على خطتك المجانية' : 'Get your free plan'}
    >
      <Sparkles size={16} />
      <span className="hidden sm:inline">{isAr ? 'احصل على خطتك المجانية' : 'Get Your Free Plan'}</span>
    </Link>
  );
}
