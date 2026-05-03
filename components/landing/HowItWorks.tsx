'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function HowItWorks() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const steps = [
    {
      num: '01',
      title: isAr ? 'بندرس عملك' : 'We Study Your Business',
      desc: isAr
        ? 'استشارة ذكية مجانية ترسم كل عملياتك وتلاقي اللي بياكل وقتك.'
        : 'Free smart consultation maps your operations and finds what eats your time.',
    },
    {
      num: '02',
      title: isAr ? 'بنبني نظامك' : 'We Build Your System',
      desc: isAr
        ? 'سير عمل مخصص حسب طريقة شغلك بالظبط، مش حلول جاهزة.'
        : 'Custom workflows built for exactly how you operate, not off-the-shelf templates.',
    },
    {
      num: '03',
      title: isAr ? 'بيزنسك بيشتغل أذكى' : 'Your Business Runs Smarter',
      desc: isAr
        ? 'الشغل اليدوي بيختفي. فريقك بيركز على النمو والعملاء.'
        : 'Manual work disappears. Your team focuses on growth and customers.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {isAr ? (
                <>إزاي <span className="text-amber-500">بنشتغل</span></>
              ) : (
                <>How It <span className="text-amber-500">Works</span></>
              )}
            </h2>
            <p className="text-muted-foreground">
              {isAr ? 'من التشخيص للتشغيل في 3 خطوات' : 'Three steps from discovery to go-live'}
            </p>
          </div>
        </ScrollReveal>
        <div className="relative">
          <div className="hidden lg:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px overflow-hidden" aria-hidden>
            <div className="h-full w-full origin-left bg-gradient-to-r from-amber-500/40 via-amber-500 to-amber-500/40 [animation:scaleX_1.2s_ease-out_0.3s_both]" />
          </div>
          <div className="grid sm:grid-cols-3 gap-10 lg:gap-6">
            {steps.map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 200}>
                <div className="text-center group">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-amber-500 bg-background mb-6 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(240,165,0,0.25)] group-hover:scale-110">
                    <span className="text-xl font-bold text-amber-500">{step.num}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
