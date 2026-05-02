'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function FinalCTA() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="section-gradient py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {isAr ? (
                <>مستعد تشوف إيه اللي ممكن نأتمته في عملك؟</>
              ) : (
                <>
                  Ready to see what we can <span className="text-amber-500">automate</span> for your business?
                </>
              )}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isAr
                ? '5 دقايق مع مستشار الـ AI بتاعنا. هتطلع بخطة أتمتة مخصصة — سواء بقيت عميل أو لأ.'
                : "5 minutes with our AI consultant. You'll walk away with a tailored automation plan — whether you become a client or not."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                nativeButton={false}
                render={<Link href="/get-started" />}
                className="rounded-xl bg-amber-500 text-black font-semibold shadow-sm hover:shadow-md hover:bg-amber-400"
              >
                {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/book-call" />}
                className="rounded-xl border-2 border-border font-semibold hover:bg-muted"
              >
                {isAr ? 'احجز مكالمة مع فريقنا' : 'Book a call with our team'}
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
