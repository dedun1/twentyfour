'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function Hero() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="relative min-h-[92vh] flex items-center pt-20 pb-20 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #f0a500, transparent 70%)' }} />
      </div>

      <ScrollReveal className="w-full relative z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          {/* Badge */}
          <span className="badge-gold mb-8 inline-flex">
            <Sparkles size={14} />
            {isAr ? 'أتمتة ذكية للأعمال الأمريكية' : 'AI-Powered Automation for US Businesses'}
          </span>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 text-foreground">
            {isAr ? (
              <>
                توقف عن توظيف ناس لشغل{' '}
                <span className="text-amber-500">السوفت وير</span> يقدر يعمله
              </>
            ) : (
              <>
                Stop Hiring People for Work{' '}
                <span className="text-amber-500">Software</span> Should Handle
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 text-muted-foreground leading-relaxed">
            {isAr
              ? 'بنبني أنظمة أتمتة مخصصة بتشيل الشغل اليدوي من على فريقك — الرسائل، الحجوزات، المتابعات، والتقارير. أنت بتنمو. النظام بيشتغل.'
              : 'We build custom automation systems that take repetitive work off your team — messaging, booking, follow-ups, and reporting. You grow. The system runs.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="btn-gold glow-gold text-base px-8 py-3">
              {isAr ? 'احصل على خطة مجانية' : 'Get Your Free Plan'}
              {isAr ? <ChevronRight size={18} className="rotate-180" /> : <ArrowRight size={18} />}
            </Link>
            <a href="#how-it-works" className="btn-outline text-base px-8 py-3">
              {isAr ? 'شوف إزاي بنشتغل' : 'See How It Works'}
            </a>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {isAr ? 'استشارة ذكية في 5 دقائق. لا حاجة لحساب.' : '5-minute AI consultation. No account needed.'}
          </p>

          {/* Trust signals */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground justify-center">
            <div className="flex items-center gap-2"><Clock size={15} />{isAr ? 'إعداد في أيام مش شهور' : 'Setup in days, not months'}</div>
            <div className="flex items-center gap-2"><Shield size={15} />{isAr ? 'بيانات آمنة ومشفرة' : 'Encrypted & secure'}</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {isAr ? 'دعم مباشر' : 'Live support'}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
