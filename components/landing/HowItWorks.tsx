'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';

export function HowItWorks() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const steps = [
    {
      num: '01',
      title: isAr ? 'بندرس عملك' : 'We Study Your Business',
      desc: isAr
        ? 'استشارة مجانية لرسم كل عملية ومعرفة إيه اللي بياكل وقتك.'
        : 'Free consultation to map every process and find what wastes your time.',
    },
    {
      num: '02',
      title: isAr ? 'بنبني نظامك' : 'We Build Your System',
      desc: isAr
        ? 'سير عمل مخصص حسب طريقة شغلك بالظبط.'
        : 'Custom workflows tailored to exactly how your business operates.',
    },
    {
      num: '03',
      title: isAr ? 'بيزنسك بيشتغل أذكى' : 'Your Business Runs Smarter',
      desc: isAr
        ? 'العمل اليدوي بيختفي. فريقك بيركز على النمو والعملاء.'
        : 'Manual work disappears. Your team focuses on growth and customers.',
    },
  ];

  return (
    <section id="how-it-works" className="section-gradient py-16 lg:py-20 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-3">{isAr ? 'إزاي بنشتغل' : 'How It Works'}</h2>
          <p className="text-muted-foreground">{isAr ? '3 خطوات بسيطة من التشخيص للتشغيل' : 'Three clear steps from discovery to go-live'}</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {steps.map((step) => (
            <Card key={step.num} className="border-border bg-card">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold mb-4 text-amber-500">{step.num}</p>
                <h3 className="font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

