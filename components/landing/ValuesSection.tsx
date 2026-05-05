'use client';

import { Zap, Target, Heart, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function ValuesSection() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const values = [
    {
      icon: Zap,
      title: isAr ? 'بساطة فعلية' : 'Real Simplicity',
      desc: isAr ? 'حلول تشتغل من أول يوم. مش تقنية معقدة محتاجة شهور.' : 'Solutions that work from day one. No complex tech that takes months.',
    },
    {
      icon: Target,
      title: isAr ? 'نتائج حقيقية' : 'Results First',
      desc: isAr ? 'كل نظام مبني على مشاكل حقيقية من عملاء حقيقيين.' : 'Every system is built around real problems from real clients.',
    },
    {
      icon: Heart,
      title: isAr ? 'شراكة مش بيع' : 'Partnership, Not a Sale',
      desc: isAr ? 'مش بتشتري برنامج. بتاخد فريق معاك على طول.' : "You're not buying software. You're getting a team that stays.",
    },
    {
      icon: TrendingUp,
      title: isAr ? 'نمو مشترك' : 'Shared Growth',
      desc: isAr ? 'لما أعمالك تنمو، النظام بينمو معاها.' : 'When your business scales, the system scales with it.',
    },
  ];

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-center mb-14 text-foreground">
            {isAr ? (
              <>ماذا <span className="text-amber-500">نؤمن</span> به</>
            ) : (
              <>What We <span className="text-amber-500">Believe</span></>
            )}
          </h2>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 gap-6">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <ScrollReveal key={v.title} delay={i * 100}>
                <div className="card-hover rounded-xl border border-border bg-card p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Icon size={20} className="text-amber-500" />
                    </div>
                    <h3 className="font-bold text-foreground">{v.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
