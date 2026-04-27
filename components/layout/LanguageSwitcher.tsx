'use client';

import { Globe } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const toggle = () => setLang(lang === 'ar' ? 'en' : 'ar');

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-fg)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all duration-300 text-sm font-semibold"
      title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe size={15} />
      <span>{lang === 'ar' ? 'EN' : 'ع'}</span>
    </button>
  );
}
