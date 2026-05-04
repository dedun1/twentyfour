'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { DiscoveryCallModal } from '@/components/booking/DiscoveryCallModal';

export function FinalCTA() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse, #f0a500, transparent 70%)' }} />
      </div>
      <ScrollReveal>
        <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {isAr ? (
              <>مستعد تشوف إيه اللي ممكن <span className="text-amber-500">نأتمته</span> ليك؟</>
            ) : (
              <>Ready to see what we&apos;d <span className="text-amber-500">automate</span> for you?</>
            )}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
            {isAr
              ? '5 دقائق مع مستشار الـ AI. هتطلع بخطة مخصصة، سواء بقيت عميل أو لأ.'
              : "5 minutes with our AI consultant. You'll walk away with a custom plan, whether you become a client or not."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started" className="btn-gold text-base px-8 py-3 inline-flex items-center gap-2">
              {isAr ? 'احصل على خطة مجانية' : 'Get Your Free Plan'}
              {isAr ? <ChevronRight size={18} className="rotate-180 shrink-0" /> : <ArrowRight size={18} className="shrink-0" />}
            </Link>
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="btn-outline text-base px-8 py-3"
            >
              {isAr ? 'احجز مكالمة' : 'Book a Call'}
            </button>
          </div>
        </div>
      </ScrollReveal>
      <DiscoveryCallModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </section>
  );
}
