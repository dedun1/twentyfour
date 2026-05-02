'use client';

import { Sparkles, Clock, User } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function TrustStrip() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const items = [
    {
      icon: Sparkles,
      title: isAr ? 'مبنية لأي نوع عمل' : 'Built for any business',
      sub: isAr ? 'من العيادات للتجارة الإلكترونية، بنتكيف مع سير عملك.' : 'From clinics to e-commerce, we adapt to your workflow.',
    },
    {
      icon: Clock,
      title: isAr ? 'شغّال خلال أسابيع، مش شهور' : 'Live in weeks, not months',
      sub: isAr
        ? 'معظم العملاء بيشتغلوا خلال أسبوعين. الأتمتة المخصصة ممكن تاخد أكتر — بنوضحلك من البداية.'
        : 'Most setups go live within 2 weeks. Custom builds may take longer — we tell you upfront.',
    },
    {
      icon: User,
      title: isAr ? 'متابعة شخصية' : 'Personal onboarding',
      sub: isAr ? 'كل عميل بياخد إعداد شخصي، مش مجرد فورم تسجيل.' : 'Every client gets hands-on setup, not a signup form.',
    },
  ];

  return (
    <section className="bg-muted/30 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid gap-4 lg:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="rounded-xl bg-card shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                      <Icon size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
