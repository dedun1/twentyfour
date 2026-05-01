'use client';

import Link from 'next/link';
import { Activity, ArrowRight, Calendar, ChevronRight, CreditCard, Globe, Shield, Clock, BarChart2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

function AutomationMockup({ lang }: { lang: 'ar' | 'en' }) {
  const rows = lang === 'ar'
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
    <div
      className="relative rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full mx-auto"
      style={{
        background: '#111827',
        border: '1px solid rgba(240,165,0,0.2)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(240,165,0,0.1)',
      }}
    >
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#1a2535', borderBottom: '1px solid rgba(240,165,0,0.08)' }}>
        <div className="flex items-center gap-2">
          <Activity size={16} style={{ color: '#f0a500' }} />
          <p className="text-sm font-semibold text-white">
            {lang === 'ar' ? 'الأنظمة الشغّالة' : 'Active Workflows'}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
          Live
        </span>
      </div>
      <div className="p-4 space-y-3">
        {rows.map(({ label, icon: Icon, count }) => (
          <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(31,41,55,0.6)', border: '1px solid rgba(240,165,0,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(240,165,0,0.15)' }}>
                <Icon size={16} style={{ color: '#f0a500' }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{label}</p>
                <p className="text-xs" style={{ color: '#22c55e' }}>● {lang === 'ar' ? 'شغّال' : 'Active'}</p>
              </div>
            </div>
            <div className="text-end">
              <p className="text-sm font-bold" style={{ color: '#f0a500' }}>{count}</p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>{lang === 'ar' ? 'اليوم' : 'today'}</p>
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
    <section className="min-h-[90vh] flex items-center pt-16 pb-16 hero-gradient">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-start order-2 lg:order-1 max-w-xl mx-auto lg:mx-0">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ background: 'rgba(240,165,0,0.12)', color: '#f0a500', border: '1px solid rgba(240,165,0,0.2)' }}>
              {isAr ? 'أتمتة ذكية لعملك' : 'Smart Automation for Business'}
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4 text-foreground">
              {isAr ? 'أتمت عملك. وفّر وقتك. اكسب أكتر.' : 'Automate Your Business. Save Time. Make More.'}
            </h1>
            <p className="text-lg mb-8 max-w-lg mx-auto lg:mx-0 text-muted-foreground">
              {isAr
                ? 'نبني سير عمل ذكي مخصص يستبدل العمل اليدوي اللي بيرهق فريقك — الرد على العملاء، الحجوزات، المتابعات، والتقارير. أنت تركز على النمو. النظام يهتم بالباقي.'
                : 'We build custom AI workflows that replace the manual work draining your team — customer messaging, booking, follow-ups, and reporting. You focus on growth. The system handles the rest.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/get-started" className="btn-gold glow-gold inline-flex">
                {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
                {isAr ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
              </Link>
              <a href="#how-it-works" className="btn-outline inline-flex justify-center">
                {isAr ? 'شوف ازاي بنشتغل' : 'See How It Works'}
              </a>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isAr ? 'استشارة ذكية في 5 دقائق. لا حاجة لحساب.' : '5-minute AI consultation. No account required.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center gap-1.5"><Globe size={14} />{isAr ? 'موثوق من فرق نامية حول العالم' : 'Trusted by growing teams worldwide'}</div>
              <div className="flex items-center gap-1.5"><Clock size={14} />{isAr ? 'دعم مستمر' : 'Always-on support'}</div>
              <div className="flex items-center gap-1.5"><Shield size={14} />{isAr ? 'تشغيل آمن' : 'Secure operations'}</div>
            </div>
          </div>
          <div className="flex justify-center order-1 lg:order-2">
            <AutomationMockup lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}

