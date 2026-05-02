'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ONBOARDING_SLOTS_PER_MONTH } from '@/lib/constants';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function UrgencyBanner() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="bg-zinc-900 dark:bg-zinc-950 text-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-2xl font-semibold text-white">
              {isAr
                ? `بنعمل أونبوردنج لـ ${ONBOARDING_SLOTS_PER_MONTH} بيزنس جديد في الشهر.`
                : `We onboard ${ONBOARDING_SLOTS_PER_MONTH} new businesses per month.`}
            </p>
            <p className="text-sm text-zinc-300 mt-3">
              {isAr
                ? 'لأن كل عميل بياخد إعداد شخصي من فريقنا — مش شات بوت بيدّعي إنه أونبوردنج. الأماكن المحدودة دي حقيقية، مش ضغط مزيف.'
                : "Because every client gets personal setup from our team — not a chatbot pretending to be onboarding. Limited slots are real, not fake urgency."}
            </p>
            <Link
              href="/get-started"
              className="inline-flex mt-6 items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black shadow-sm hover:bg-amber-400 transition-colors"
            >
              {isAr ? 'احجز مكانك ←' : 'Claim your spot →'}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
