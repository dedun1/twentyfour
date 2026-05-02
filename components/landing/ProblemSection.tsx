'use client';

import { MessageCircleX, PhoneOff, CalendarX, FileSpreadsheet, Sunrise, UserMinus } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';

export function ProblemSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const cards = [
    {
      icon: MessageCircleX,
      title: isAr ? 'بترد على نفس الأسئلة على الرسائل عشر مرات في اليوم' : 'Answering the same customer messages ten times a day',
      sub: isAr ? 'إيه مواعيدكم؟ بتوصلوا؟ السعر كام؟' : 'What time do you open? Do you deliver? How much?',
    },
    {
      icon: PhoneOff,
      title: isAr ? 'بتفوّت حجوزات لأن مفيش حد كان عند التليفون' : 'Missing bookings because no one was at the phone',
      sub: isAr ? 'العميل بيروح لحد تاني. وأنت مش حتى عارف.' : "Customer goes elsewhere. You don't even know it happened.",
    },
    {
      icon: CalendarX,
      title: isAr ? 'عملاء بيخلفوا المواعيد لأن محدش فكّرهم' : 'Customers no-showing because no one reminded them',
      sub: isAr ? '20-30% من الحجوزات بتختفي من غير متابعة.' : '20-30% of bookings vanish without follow-up.',
    },
    {
      icon: FileSpreadsheet,
      title: isAr ? 'بتنقل البيانات على الإكسل بعد كل طلب' : 'Copying data into spreadsheets after every order',
      sub: isAr ? 'ساعات من الكتابة. غلطة واحدة والتقرير كله بيتلخبط.' : 'Hours of typing. One error and the whole report is wrong.',
    },
    {
      icon: Sunrise,
      title: isAr ? 'بتبدأ كل يوم بمحاولة اللحاق بفوضى إمبارح' : "Starting every day catching up on yesterday's chaos",
      sub: isAr ? 'الشغل الحقيقي للنمو ما بيبدأش غير الساعة 11.' : "Real growth work doesn't start until 11am.",
    },
    {
      icon: UserMinus,
      title: isAr ? 'بتوظف ناس أكتر عشان يعملوا شغل المفروض السوفت وير يعمله' : 'Hiring more staff to handle work software should do',
      sub: isAr ? 'مرتبات الأتمتة ممكن تستبدلها في شهر.' : 'Salaries that automation could replace in a month.',
    },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">{isAr ? 'ده بيحصل معاك؟' : 'Sound familiar?'}</h2>
        <p className="text-muted-foreground mb-8">
          {isAr
            ? 'معظم الأعمال النامية بتخسر من 3 لـ 5 ساعات كل يوم في مهام متكررة ما المفروض تعملها.'
            : "Most growing businesses lose 3-5 hours a day to repetitive tasks they shouldn't be doing."}
        </p>
      </div>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="bg-card border-border">
                <CardContent className="p-5 text-start">
                  <Icon size={18} className="text-muted-foreground mb-3" />
                  <p className="font-semibold text-foreground mb-1">{card.title}</p>
                  <p className="text-sm italic text-muted-foreground">{card.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-center text-lg text-foreground mt-8">
          {isAr ? 'بنينا TwentyFour لأن كل مشكلة من دول ليها حل.' : 'We built TwentyFour because every one of these problems has a solution.'}
        </p>
      </div>
    </section>
  );
}

