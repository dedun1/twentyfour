'use client';

import Link from 'next/link';
import { Activity, ArrowRight, Calendar, ChevronRight, CreditCard, Globe, Shield, Clock, BarChart2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function AutomationMockup({ lang }: { lang: 'ar' | 'en' }) {
  const rows =
    lang === 'ar'
      ? [
          { label: 'حجوزات العملاء', icon: Calendar, count: '24' },
          { label: 'تذكيرات الدفع', icon: CreditCard, count: '12' },
          { label: 'التقارير اليومية', icon: BarChart2, count: '11' },
        ]
      : [
          { label: 'Client Booking', icon: Calendar, count: '24' },
          { label: 'Payment Reminders', icon: CreditCard, count: '12' },
          { label: 'Daily Reports', icon: BarChart2, count: '11' },
        ];

  return (
    <div className="relative rounded-3xl overflow-hidden max-w-sm w-full mx-auto bg-zinc-900 shadow-xl border border-zinc-700/50">
      <div className="px-5 py-4 flex items-center justify-between bg-zinc-800/90 border-b border-amber-500/15">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-amber-500" />
          <p className="text-sm font-semibold text-white">{lang === 'ar' ? 'الأنظمة الشغّالة' : 'Active Workflows'}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">Live</span>
      </div>
      <div className="p-4 space-y-3">
        {rows.map(({ label, icon: Icon, count }) => (
          <div
            key={label}
            className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 border border-amber-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/15">
                <Icon size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-xs text-emerald-400">● {lang === 'ar' ? 'شغّال' : 'Active'}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold text-amber-500">{count}</p>
              <p className="text-xs text-zinc-400">{lang === 'ar' ? 'اليوم' : 'today'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="min-h-[90vh] flex items-center pt-16 pb-16 sm:pb-20 hero-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-28">
        <ScrollReveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-start order-2 lg:order-1 max-w-xl mx-auto lg:mx-0">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-6 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                {isAr ? 'أتمتة ذكية لعملك' : 'Smart Automation for Business'}
              </span>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4 text-foreground">
                {isAr ? (
                  <>
                    <span className="text-amber-500">أتمت</span> عملك. وفّر وقتك. اكسب أكتر.
                  </>
                ) : (
                  <>
                    <span className="text-amber-500">Automate</span> Your Business. Save Time. Make More.
                  </>
                )}
              </h1>
              <p className="text-lg mb-8 max-w-lg mx-auto lg:mx-0 text-muted-foreground">
                {isAr
                  ? 'نبني سير عمل ذكي مخصص يستبدل العمل اليدوي اللي بيرهق فريقك — الرد على العملاء، الحجوزات، المتابعات، والتقارير. أنت تركز على النمو. النظام يهتم بالباقي.'
                  : 'We build custom AI workflows that replace the manual work draining your team — customer messaging, booking, follow-ups, and reporting. You focus on growth. The system handles the rest.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-black font-semibold shadow-sm hover:shadow-md px-6 py-3 transition-shadow"
                >
                  {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
                  {isAr ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-transparent text-foreground hover:bg-muted font-semibold px-6 py-3 transition-colors"
                >
                  {isAr ? 'شوف ازاي بنشتغل' : 'See How It Works'}
                </a>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isAr ? 'استشارة ذكية في 5 دقائق. لا حاجة لحساب.' : '5-minute AI consultation. No account required.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground justify-center lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <Globe size={14} />
                  {isAr ? 'موثوق من فرق نامية حول العالم' : 'Trusted by growing teams worldwide'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {isAr ? 'دعم مستمر' : 'Always-on support'}
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={14} />
                  {isAr ? 'تشغيل آمن' : 'Secure operations'}
                </div>
              </div>
            </div>
            <div className="flex justify-center order-1 lg:order-2">
              <AutomationMockup lang={lang} />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
