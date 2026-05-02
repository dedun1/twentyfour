'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ONBOARDING_SLOTS_PER_MONTH } from '@/lib/constants';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function UrgencyBanner() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="py-8 bg-amber-50 dark:bg-amber-950/20 border-y border-amber-200 dark:border-amber-900">
      <ScrollReveal>
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-2xl font-semibold text-foreground">
          {isAr
            ? `بنعمل أونبوردنج لـ ${ONBOARDING_SLOTS_PER_MONTH} بيزنس جديد في الشهر.`
            : `We onboard ${ONBOARDING_SLOTS_PER_MONTH} new businesses per month.`}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {isAr
            ? 'لأن كل عميل بياخد إعداد شخصي من فريقنا — مش شات بوت بيدّعي إنه أونبوردنج. الأماكن المحدودة دي حقيقية، مش ضغط مزيف.'
            : "Because every client gets personal setup from our team — not a chatbot pretending to be onboarding. Limited slots are real, not fake urgency."}
        </p>
        <Link href="/get-started" className="inline-flex mt-4 text-sm btn-outline">
          {isAr ? 'احجز مكانك ←' : 'Claim your spot →'}
        </Link>
      </div>
      </ScrollReveal>
    </section>
  );
}

