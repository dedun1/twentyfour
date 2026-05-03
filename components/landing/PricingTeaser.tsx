'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { STARTER_PRICE_USD, CUSTOM_PRICE_USD_MIN } from '@/lib/constants';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function PricingTeaser() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="py-16 lg:py-20">
      <ScrollReveal>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            {isAr ? (
              <>أسعار <span className="text-amber-500">شفافة</span></>
            ) : (
              <><span className="text-amber-500">Transparent</span> pricing</>
            )}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isAr
              ? `تبدأ من ${STARTER_PRICE_USD} دولار/شهر. الأتمتة المخصصة من ${CUSTOM_PRICE_USD_MIN} دولار. بنحدد سعرك بعد الاستشارة المجانية، مش قبل ما نفهم عملك.`
              : `Starting at $${STARTER_PRICE_USD}/month. Custom workflows from $${CUSTOM_PRICE_USD_MIN}. We quote your exact price after the free consultation, never before we understand your business.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pricing" className="btn-gold inline-flex px-7 py-2.5">
              {isAr ? 'شوف الأسعار كاملة' : 'See Full Pricing'}
            </Link>
            <Link href="/get-started" className="btn-outline inline-flex px-7 py-2.5">
              {isAr ? 'احصل على عرض سعر مجاني' : 'Get a Free Quote'}
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
