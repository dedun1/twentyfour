'use client';

import { MessageCircleX, PhoneOff, CalendarX, FileSpreadsheet, Sunrise, UserMinus } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function ProblemSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const cards = [
    {
      icon: MessageCircleX,
      title: isAr ? 'بترد على نفس الأسئلة كل يوم' : 'Answering the same questions every day',
      sub: isAr ? 'إيه مواعيدكم؟ بتوصلوا؟ السعر كام؟' : '"What are your hours?" "Do you deliver?" "How much?"',
    },
    {
      icon: PhoneOff,
      title: isAr ? 'بتفوّت حجوزات لأن محدش رد' : 'Missing bookings because nobody picked up',
      sub: isAr ? 'العميل بيروح لحد تاني وأنت مش حتى عارف.' : "The customer goes elsewhere. You don't even know.",
    },
    {
      icon: CalendarX,
      title: isAr ? 'عملاء بيخلفوا المواعيد' : 'Customers no-showing on appointments',
      sub: isAr ? '20-30% من الحجوزات بتختفي بدون تذكير.' : '20–30% of bookings vanish without a reminder.',
    },
    {
      icon: FileSpreadsheet,
      title: isAr ? 'بتنقل بيانات يدوي بعد كل طلب' : 'Copying data by hand after every order',
      sub: isAr ? 'ساعات كتابة. غلطة واحدة والتقرير كله بيتلخبط.' : 'Hours of entry. One mistake and the report is wrong.',
    },
    {
      icon: Sunrise,
      title: isAr ? 'بتبدأ كل يوم بلحاق فوضى إمبارح' : "Starting every morning cleaning up yesterday's mess",
      sub: isAr ? 'الشغل الحقيقي مش بيبدأ غير الساعة 11.' : "Real growth work doesn't start until 11 AM.",
    },
    {
      icon: UserMinus,
      title: isAr ? 'بتوظف ناس لشغل السوفت وير يعمله' : 'Hiring staff for tasks software should handle',
      sub: isAr ? 'مرتبات الأتمتة ممكن تستبدلها في شهر.' : 'Salaries that automation replaces in a month.',
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {isAr ? (
                <>ده بيحصل <span className="text-amber-500">معاك</span>؟</>
              ) : (
                <>Sound <span className="text-amber-500">familiar</span>?</>
              )}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isAr
                ? 'معظم الأعمال النامية بتخسر 3–5 ساعات يومياً في مهام مفروض ما تعملهاش.'
                : "Most growing businesses lose 3–5 hours a day to tasks they shouldn't be doing."}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <ScrollReveal key={card.title} delay={i * 80}>
                <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(240,165,0,0.06)]">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 dark:bg-red-500/[0.07] flex items-center justify-center mb-4">
                    <Icon size={20} className="text-red-400" />
                  </div>
                  <p className="font-semibold text-foreground mb-1.5 leading-snug">{card.title}</p>
                  <p className="text-sm text-muted-foreground italic">{card.sub}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={500}>
          <p className="text-center text-lg font-medium text-foreground mt-12">
            {isAr ? 'بنينا TwentyFour لأن كل مشكلة من دول ليها حل.' : 'We built TwentyFour because every one of these has a fix.'}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
