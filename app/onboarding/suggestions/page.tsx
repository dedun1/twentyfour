'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SuggestionCard } from '@/components/onboarding/SuggestionCard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import type { Suggestion, OnboardingData } from '@/lib/types';

const getFallbackSuggestions = (lang: 'ar' | 'en'): Suggestion[] => {
  if (lang === 'ar') {
    return [
      {
        id: '1',
        title: 'إدارة المواعيد',
        description: 'أضف مواعيدك وأدرها بالكامل من لوحة التحكم',
        category: 'مواعيد',
        icon: 'Calendar',
      },
      {
        id: '2',
        title: 'المساعد الذكي',
        description: 'استخدم المساعد الذكي للحصول على إجابات فورية ومساعدة في عملك',
        category: 'ذكاء اصطناعي',
        icon: 'MessageSquare',
      },
      {
        id: '3',
        title: 'إعداد تذكيرات تلقائية',
        description: 'أنشئ تذكيرات تلقائية لعملائك قبل مواعيدهم',
        category: 'تذكيرات',
        icon: 'Bell',
      },
      {
        id: '4',
        title: 'تتبع الأداء',
        description: 'راقب أداء عملك عبر تقارير ورسوم بيانية مفصلة',
        category: 'تقارير',
        icon: 'BarChart2',
      },
    ];
  }

  return [
    {
      id: '1',
      title: 'Appointment Management',
      description: 'Add and manage your appointments fully from the dashboard',
      category: 'Appointments',
      icon: 'Calendar',
    },
    {
      id: '2',
      title: 'AI Assistant',
      description: 'Use the AI assistant for instant answers and help in your business',
      category: 'AI Assistant',
      icon: 'MessageSquare',
    },
    {
      id: '3',
      title: 'Smart Reminders',
      description: 'Create automatic reminders for your clients before their appointments',
      category: 'Reminders',
      icon: 'Bell',
    },
    {
      id: '4',
      title: 'Performance Tracking',
      description: 'Monitor your business performance through detailed reports and charts',
      category: 'Reports',
      icon: 'BarChart2',
    },
  ];
};

export default function SuggestionsPage() {
  const { lang } = useLanguage();
  const t = useT(lang);
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = sessionStorage.getItem('onboarding-data');
      if (!stored) {
        setSuggestions(getFallbackSuggestions(lang));
        setLoading(false);
        return;
      }

      const businessData: OnboardingData = JSON.parse(stored);

      try {
        const res = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessData, lang }),
        });

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          } else {
            setSuggestions(getFallbackSuggestions(lang));
          }
        } else {
          setSuggestions(getFallbackSuggestions(lang));
        }
      } catch {
        setSuggestions(getFallbackSuggestions(lang));
      }

      setLoading(false);
    };

    load();
  }, [lang]);

  return (
    <div
      className="min-h-screen"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      lang={lang}
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
        <LanguageSwitcher />
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #f0a500, #ffd700)' }}
          >
            <Zap size={28} className="text-[#0a0f1e]" />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--foreground)] mb-2">
            {t.onboarding.suggestionsTitle}
          </h1>
          <p className="text-[var(--muted-fg)]">{t.onboarding.suggestionsSubtitle}</p>
        </div>

        {/* Suggestions */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <span className="spinner" style={{ width: 40, height: 40 }} />
            <p className="text-[var(--muted-fg)]">{t.onboarding.thinking}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {suggestions.map((suggestion, i) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="text-center animate-fade-in">
            <Link href="/dashboard" className="btn-gold text-base px-10 py-4">
              <Zap size={18} />
              {t.onboarding.getStarted}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
