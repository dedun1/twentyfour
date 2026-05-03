'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ONBOARDING_SLOTS_PER_MONTH } from '@/lib/constants';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function UrgencyBanner() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="py-14 lg:py-16 bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200/60 dark:border-amber-800/30">
      <ScrollReveal>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            {isAr
              ? `بنعمل أونبوردنج لـ ${ONBOARDING_SLOTS_PER_MONTH} بيزنس بس في الشهر.`
              : `We onboard only ${ONBOARDING_SLOTS_PER_MONTH} businesses per month.`}
          </p>
          <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
            {isAr
              ? 'لأن كل عميل بياخد إعداد شخصي من فريقنا، مش شات بوت. الأماكن المحدودة دي حقيقية.'
              : 'Because every client gets personal setup from our team, not a chatbot. Limited slots are real.'}
          </p>
          <Link href="/get-started" className="btn-gold inline-flex text-base px-7 py-2.5">
            {isAr ? 'احجز مكانك' : 'Claim Your Spot'}
            {isAr ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
