'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock, Shield } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function Hero() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="relative min-h-[92vh] flex items-center pt-20 pb-20 overflow-hidden hero-gradient">
      <ScrollReveal className="w-full relative z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span className="badge-gold mb-8 inline-flex">
            {isAr ? 'من ساعات لثواني' : 'From hours to seconds'}
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6 text-foreground">
            {isAr ? (
              <>اشتغل أقل <span className="text-amber-500">على</span> بيزنسك. اشتغل أكتر على <span className="text-amber-500">تكبيره</span>.</>
            ) : (
              <>Work Less <span className="text-amber-500">on</span> Your Business. Work More on <span className="text-amber-500">Growing</span> It.</>
            )}
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 text-muted-foreground leading-relaxed">
            {isAr
              ? 'بنبني أنظمة أتمتة مخصصة بتشيل الشغل اليدوي من على فريقك. الرسائل، الحجوزات، المتابعات، والتقارير. أنت بتنمو، والنظام بيشتغل.'
              : 'We build custom automation systems that handle the manual work draining your team. Messaging, booking, follow-ups, and reporting. You grow, the system runs.'}
          </p>
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
            {isAr ? 'استشارة ذكية في 5 دقائق. لا حاجة لحساب.' : '5-minute smart consultation. No account needed.'}
          </p>
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
