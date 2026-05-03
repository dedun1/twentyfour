'use client';

import Link from 'next/link';
import { Calendar, ArrowRight, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Footer } from '@/components/layout/Footer';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export default function BookCallPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 lg:pt-28 pb-16">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <Calendar size={28} className="text-amber-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {isAr ? (
                <>احجز <span className="text-amber-500">مكالمة</span> مع فريقنا</>
              ) : (
                <>Book a <span className="text-amber-500">Call</span> With Our Team</>
              )}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {isAr
                ? '30 دقيقة مع فريقنا. بنراجع خطة الأتمتة بتاعتك، بنجاوب على كل أسئلتك، وبنحدد الجدول الزمني. بدون ضغط. بدون دفع لحد ما تكون متأكد 100%.'
                : '30 minutes with our team. We review your automation plan, answer every question, and lock in your timeline. No pressure. No payment until you are 100% sure.'}
            </p>
            <div className="rounded-xl border border-border bg-card p-8 mb-8">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Calendar size={20} className="text-amber-500" />
              </div>
              <p className="font-semibold text-foreground mb-2">
                {isAr ? 'رابط الحجز قريباً' : 'Booking link coming soon'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? 'في الوقت الحالي، ابدأ بالاستشارة المجانية وفريقنا هيتواصل معاك لحجز المكالمة.'
                  : 'In the meantime, start with the free consultation and our team will reach out to schedule your call.'}
              </p>
            </div>
            <Link href="/get-started" className="btn-gold inline-flex text-base px-8 py-3">
              {isAr ? 'ابدأ الاستشارة المجانية' : 'Start Free Consultation'}
              {isAr ? <ChevronRight size={18} className="rotate-180" /> : <ArrowRight size={18} />}
            </Link>
          </div>
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}
