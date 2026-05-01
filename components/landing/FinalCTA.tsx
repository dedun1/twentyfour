'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { SUPPORT_WHATSAPP } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const text = encodeURIComponent('Hi TwentyFour, I have a question about your service.');
  const waHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${text}`;

  return (
    <section className="section-gradient py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          {isAr ? 'مستعد تشوف إيه اللي ممكن نأتمته في عملك؟' : "Ready to see what we'd automate for you?"}
        </h2>
        <p className="text-muted-foreground mb-6">
          {isAr
            ? '5 دقايق مع مستشار الـ AI بتاعنا. هتطلع بخطة أتمتة مخصصة — سواء بقيت عميل أو لأ.'
            : "5 minutes with our AI consultant. You'll walk away with a tailored automation plan — whether you become a client or not."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button nativeButton={false} render={<Link href="/get-started" />}>
            {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
          </Button>
          <Button variant="outline" nativeButton={false} render={<a href={waHref} target="_blank" rel="noopener noreferrer" />}>
            {isAr ? 'تواصل مع شخص حقيقي على واتساب' : 'Talk to a Human on WhatsApp'}
          </Button>
        </div>
      </div>
    </section>
  );
}

