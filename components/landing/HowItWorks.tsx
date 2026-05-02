'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

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
      desc: isAr ? 'سير عمل مخصص حسب طريقة شغلك بالظبط.' : 'Custom workflows tailored to exactly how your business operates.',
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
    <section id="how-it-works" className="bg-muted/30 py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-3">{isAr ? 'إزاي بنشتغل' : 'How It Works'}</h2>
            <p className="text-muted-foreground">{isAr ? '3 خطوات بسيطة من التشخيص للتشغيل' : 'Three clear steps from discovery to go-live'}</p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step) => (
              <Card key={step.num} className="rounded-xl bg-card shadow-sm border-0">
                <CardContent className="p-6 text-center">
                  <p className="text-amber-500 text-3xl font-bold mb-4">{step.num}</p>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
