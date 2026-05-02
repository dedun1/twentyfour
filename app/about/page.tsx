'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Eye, Target, Zap, TrendingUp, Heart } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookCallButton } from '@/components/layout/BookCallButton';
import { Card, CardContent } from '@/components/ui/card';

export default function AboutPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const howWeWork = [
    {
      num: '01',
      title: isAr ? 'مكالمة استكشاف مجانية' : 'Free Discovery Call',
      desc: isAr ? 'بنتعرف على شغلتك بالتفصيل' : 'We learn your business in detail.',
    },
    {
      num: '02',
      title: isAr ? 'عرض مخصص' : 'Custom Proposal',
      desc: isAr ? 'بنرسم بالظبط هنأتمت إيه وإزاي' : 'We map exactly what to automate and how.',
    },
    {
      num: '03',
      title: isAr ? 'بناء وتجريب' : 'Build & Test',
      desc: isAr
        ? 'عادة من أسبوع لـ 3 أسابيع حسب التعقيد — والجدول الدقيق بيتأكد في العرض.'
        : 'Usually 1-3 weeks depending on complexity — exact timeline confirmed in your proposal.',
    },
    {
      num: '04',
      title: isAr ? 'إطلاق ودعم' : 'Launch & Support',
      desc: isAr ? 'أنت بتدير شغلتك. إحنا بنحافظ على النظام شغّال' : 'You run your business. We keep the system running.',
    },
  ];

  const whyTwentyFour = isAr
    ? [
        'بنفهم تشغيل الأعمال الصغيرة من الجذور',
        'بنبني علشان النتايج، مش الشكل',
        'الإعداد بسرعة وبخطة واضحة',
        'تسعير شفاف بعد ما نفهم احتياجاتك',
      ]
    : [
        'We understand small business operations from the ground up',
        'We build for results, not for show',
        'Fast setup with clear planning',
        'Transparent pricing after we understand your needs',
      ];

  const values = [
    {
      icon: Zap,
      title: isAr ? 'بساطة فعلية' : 'Real Simplicity',
      desc: isAr ? 'مش تقنية معقدة. حل عملي يشتغل من أول يوم' : 'Not complex tech. A practical solution that works from day one.',
    },
    {
      icon: Target,
      title: isAr ? 'نتائج حقيقية' : 'Real Results',
      desc: isAr ? 'كل نظام بنبنيه بناءً على مشاكل حقيقية لعملاء حقيقيين' : 'Every system we build is based on real problems from real clients.',
    },
    {
      icon: Heart,
      title: isAr ? 'دعم مستمر' : 'Continuous Support',
      desc: isAr ? 'فريقنا معاك دايماً. مش بتشتري برنامج، بتاخد شريك' : "Our team is always with you. You're not buying software, you're getting a partner.",
    },
    {
      icon: TrendingUp,
      title: isAr ? 'نمو مشترك' : 'Shared Growth',
      desc: isAr ? 'لما أعمالكم تنمو، إحنا بننمو معاها' : 'When your business grows, we grow with it.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24">
        <section className="hero-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-foreground">
              {isAr ? 'بنبني أنظمة عشان أنت ما تبنيهاش' : "We Build Systems So You Don't Have To"}
            </h1>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              {isAr
                ? 'TwentyFour بتبني أتمتة مخصصة للأعمال اللي عايزة تنمو من غير ما تكبّر فريقها.'
                : 'TwentyFour creates custom automation for businesses that want to grow without growing their team.'}
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">{isAr ? 'قصتنا' : 'Our story'}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {isAr
                ? 'TwentyFour بدأت من إحباط بسيط: شفنا الأعمال بتقضي أحسن ساعاتها في شغل المفروض السوفت وير يعمله. إحنا مهندسين. عرفنا إن الأتمتة تقدر تحل المشكلة دي. فبنينا TwentyFour للأعمال اللي معندهاش فرق هندسية بس تستاهل أتمتة على مستوى الشركات الكبيرة. إحنا بنبني. هما بياخدوا النتايج.'
                : "TwentyFour started with a simple frustration: watching businesses spend their best hours on work software should handle. We're builders. We knew automation could solve it. So we built TwentyFour for businesses that don't have engineering teams but deserve enterprise-grade automation. We do the building. They get the results."}
            </p>
          </div>
        </section>

        <section className="section-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">{isAr ? 'إزاي بنشتغل' : 'How We Work'}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {howWeWork.map((step) => (
                <Card key={step.num} className="border-border bg-card">
                  <CardContent className="p-5">
                    <p className="text-3xl font-bold mb-3 text-amber-500">{step.num}</p>
                    <h3 className="font-bold mb-1.5 text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-6">
            <Card className="border-border bg-card">
              <CardContent className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Target size={20} className="text-amber-500" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{isAr ? 'مهمتنا' : 'Our Mission'}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'نخلي الأتمتة الذكية متاحة وعملية للأعمال اللي محتاجة تنمو بدون تحميل فريقها عبء إضافي.'
                    : 'Make practical, high-impact automation accessible for businesses that need growth without adding operational overhead.'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Eye size={20} className="text-blue-500" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{isAr ? 'رؤيتنا' : 'Our Vision'}</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'كل صاحب عمل يقدر يبني نظام تشغيل أذكى بدون الحاجة لفريق هندسي داخلي.'
                    : 'Every business owner can run smarter operations without needing an in-house engineering team.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">{isAr ? 'ليه TwentyFour' : 'Why TwentyFour'}</h2>
            <div className="space-y-3">
              {whyTwentyFour.map((item) => (
                <Card key={item} className="border-border bg-card">
                  <CardContent className="p-5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/15 text-green-500 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                    <p className="text-sm leading-relaxed text-foreground">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-gradient py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">{isAr ? 'قيمنا' : 'Our Values'}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="border-border bg-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><Icon size={20} className="text-amber-500" /></div>
                        <h3 className="font-bold text-foreground">{value.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{value.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              {isAr ? 'مستعد تشوف إيه اللي نقدر نأتمته لعملك؟' : 'Ready to see what we can automate for your business?'}
            </h2>
            <Link href="/get-started" className="btn-gold inline-flex">
              {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
              {isAr ? <ChevronRight size={16} className="rotate-180" /> : <ArrowRight size={16} />}
            </Link>
          </div>
        </section>
      </div>
      <Footer />
      <BookCallButton />
    </div>
  );
}

