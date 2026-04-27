'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from '@/lib/translations';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
  dir: 'rtl',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');

  useEffect(() => {
    const stored = localStorage.getItem('tf-lang') as Lang | null;
    if (stored === 'ar' || stored === 'en') {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('tf-lang', newLang);
    document.cookie = `tf-lang=${newLang}; path=/; max-age=31536000`;
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
