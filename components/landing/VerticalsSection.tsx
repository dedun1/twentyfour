'use client';

import Link from 'next/link';
import { Stethoscope, UtensilsCrossed, ShoppingBag, Building2 } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function VerticalsSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const items = [
    {
      icon: Stethoscope,
      title: isAr ? 'العيادات والرعاية الصحية' : 'Clinics & Healthcare',
      desc: isAr ? 'حجز المرضى، التذكيرات، المتابعة' : 'Patient booking, reminders, follow-up care',
    },
    {
      icon: UtensilsCrossed,
      title: isAr ? 'المطاعم والكافيهات' : 'Restaurants & Cafés',
      desc: isAr ? 'الحجوزات، الطلبات، تنسيق الديليفري' : 'Reservations, orders, delivery coordination',
    },
    {
      icon: ShoppingBag,
      title: isAr ? 'التجارة الإلكترونية' : 'E-commerce & Retail',
      desc: isAr ? 'تتبع الطلبات، الإرجاع، دعم العملاء' : 'Order tracking, returns, customer support',
    },
    {
      icon: Building2,
      title: isAr ? 'العقارات والخدمات' : 'Real Estate & Services',
      desc: isAr ? 'جذب العملاء، المعاينات، المتابعات' : 'Lead capture, viewings, follow-up sequences',
    },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {isAr ? (
                <>مبنية للأعمال اللي عندها <span className="text-amber-500">تدفق عملاء مستمر</span></>
              ) : (
                <>Built for businesses with a <span className="text-amber-500">steady stream</span> of customers</>
              )}
            </h2>
            <p className="text-muted-foreground">
              {isAr
                ? 'لو بتتعامل مع عشرات الحجوزات، الطلبات، أو الاستفسارات في الأسبوع، ده ليك.'
                : 'If you handle dozens of bookings, orders, or inquiries a week, this is for you.'}
            </p>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.title} delay={i * 80}>
                <div className="card-hover rounded-xl border border-border bg-card p-5 h-full">
                  <Icon size={18} className="text-amber-500 mb-3" />
                  <p className="font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
        <ScrollReveal delay={400}>
          <div className="text-center mt-6">
            <Link href="/get-started" className="text-sm text-muted-foreground hover:text-foreground underline">
              {isAr ? 'نوع عمل مختلف؟ كلمنا، على الأغلب بنشتغل عليه كمان.' : 'Different business? Tell us. We probably handle it too.'}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
