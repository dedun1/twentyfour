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
    <section className="section-dark py-16 lg:py-20">
      <ScrollReveal>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isAr
              ? `بنعمل أونبوردنج لـ ${ONBOARDING_SLOTS_PER_MONTH} بيزنس بس في الشهر.`
              : `We onboard only ${ONBOARDING_SLOTS_PER_MONTH} businesses per month.`}
          </p>
          <p className="text-base text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed">
            {isAr
              ? 'لأن كل عميل بياخد إعداد شخصي من فريقنا — مش شات بوت. الأماكن المحدودة دي حقيقية.'
              : 'Because every client gets personal setup from our team — not a chatbot. Limited slots are real.'}
          </p>
          <Link href="/get-started" className="btn-gold inline-flex text-base px-8 py-3">
            {isAr ? 'احجز مكانك' : 'Claim Your Spot'}
            {isAr ? <ChevronRight size={18} className="rotate-180" /> : <ArrowRight size={18} />}
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}
