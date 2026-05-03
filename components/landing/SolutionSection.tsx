'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function SolutionSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const cards = [
    {
      num: '01',
      title: isAr ? 'العملاء بيخدموا نفسهم، 24 ساعة' : 'Customers serve themselves, 24/7',
      body: isAr
        ? 'الـ AI بتاعنا بيجاوب على الأسئلة، بياخد الحجوزات، وبيتعامل مع العملاء الدايمين بلغتهم، على القنوات اللي بيستخدموها. تليفونك بيبطّل يرن في الحاجات اللي ما المفروض تتعامل معاها.'
        : 'Our AI answers questions, takes bookings, and handles repeat customers in their language, on the channels they already use. Your phone stops ringing for things you should not be handling.',
      tags: ['SMS', 'Instagram', 'Email', 'Web chat'],
    },
    {
      num: '02',
      title: isAr ? 'يومك بيبدأ بوضوح، مش بفوضى' : 'Your day starts with clarity, not chaos',
      body: isAr
        ? 'كل يوم الساعة 8 الصبح، رسالة واحدة بتيجي على إنبوكسك: مدخول إمبارح، حجوزات النهاردة، اللي ما حضروش، وإيه اللي محتاج انتباهك. قراية دقيقتين بدل نص ساعة لخبطة.'
        : "Every morning at 8am, one summary lands in your inbox: yesterday's revenue, today's bookings, no-shows, and what needs your attention. A two-minute read instead of a 30-minute scramble.",
      tags: isAr ? ['تقرير يومي', 'تنبيهات ذكية', 'تتبع الإيراد'] : ['Daily report', 'Smart alerts', 'Revenue tracking'],
    },
    {
      num: '03',
      title: isAr ? 'فريقك بيركز على النمو، مش على إدخال بيانات' : 'Your team focuses on growth, not data entry',
      body: isAr
        ? 'الحجوزات، بيانات العملاء، المدفوعات كل حاجة بتتسجل في لوحة تحكم واحدة أوتوماتيكي. مفيش copy-paste، مفيش إكسل، مفيش تفاصيل ضايعة. فريقك بيشتغل على العملاء، مش على الورق.'
        : 'Bookings, customer info, and payments all flow into one dashboard automatically. No copy-pasting, no spreadsheets, no missed details. Your team works on customers, not paperwork.',
      tags: isAr ? ['لوحة موحدة', 'مزامنة تلقائية', 'بيانات لحظية'] : ['Unified dashboard', 'Auto-sync', 'Real-time data'],
    },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {isAr ? (
                <>اللي <span className="text-amber-500">بيتغير</span> في عملك</>
              ) : (
                <>What <span className="text-amber-500">changes</span> for you</>
              )}
            </h2>
            <p className="text-muted-foreground">
              {isAr ? 'تلات حاجات كل عميل من TwentyFour بياخدها في أول شهر.' : 'Three things every TwentyFour client gains in the first month.'}
            </p>
          </div>
        </ScrollReveal>
        <div className="grid lg:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <ScrollReveal key={card.num} delay={i * 100}>
              <div className="card-hover rounded-xl border border-border bg-card p-6 space-y-4 h-full">
                <p className="text-amber-500 font-bold">{card.num}</p>
                <h3 className="text-xl font-bold text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
