'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { STARTER_PRICE_USD, CUSTOM_PRICE_USD_MIN } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function PricingTeaser() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {isAr ? (
                <>أسعار شفافة</>
              ) : (
                <>
                  <span className="text-amber-500">Transparent</span> pricing
                </>
              )}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isAr
                ? `تبدأ من ${STARTER_PRICE_USD} دولار/شهر. الأتمتة المخصصة من ${CUSTOM_PRICE_USD_MIN} دولار. بنحدد سعرك بعد الاستشارة المجانية — مش قبل ما نفهم عملك.`
                : `Starting at $${STARTER_PRICE_USD}/month. Custom workflows from $${CUSTOM_PRICE_USD_MIN}. We quote your exact price after the free consultation — never before we understand your business.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button nativeButton={false} render={<Link href="/pricing" />}>
                {isAr ? 'شوف الأسعار كاملة' : 'See Full Pricing'}
              </Button>
              <Button variant="outline" nativeButton={false} render={<Link href="/get-started" />}>
                {isAr ? 'احصل على عرض سعر مجاني' : 'Get Free Quote'}
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
