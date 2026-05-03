'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Zap, Target, Heart, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Footer } from '@/components/layout/Footer';
import { BookCallButton } from '@/components/layout/BookCallButton';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export default function AboutPage() {
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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(ellipse, #f0a500, transparent 70%)' }} />
        </div>
        <ScrollReveal>
          <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 text-foreground">
              {isAr ? (
                <>بنبني <span className="text-amber-500">أنظمة</span> عشان أنت ما تبنيهاش</>
              ) : (
                <>We Build the <span className="text-amber-500">Systems</span> So You Don&apos;t Have To</>
              )}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {isAr
                ? 'أتمتة مخصصة للأعمال اللي عايزة تنمو بدون ما تكبّر فريقها.'
                : 'Custom automation for businesses that want to grow without growing their team.'}
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Our Story */}
      <section className="py-16 lg:py-24">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
              {isAr ? (
                <>قصت<span className="text-amber-500">نا</span></>
              ) : (
                <>Our <span className="text-amber-500">Story</span></>
              )}
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4 text-center">
              <p>
                {isAr
                  ? 'بدأنا TwentyFour بعد ما شفنا نفس المشكلة في كل بيزنس قابلناه: أصحاب أعمال أذكياء بيقضوا أحسن ساعاتهم في شغل المفروض السوفت وير يعمله.'
                  : 'We started TwentyFour after seeing the same pattern in every business we met: smart owners spending their best hours on work that software should handle.'}
              </p>
              <p>
                {isAr
                  ? 'إحنا مهندسين. عرفنا إن الأتمتة تقدر تحل المشكلة دي، بس معظم أدوات الأتمتة اتبنت للشركات الكبيرة اللي عندها فرق هندسية. فبنينا TwentyFour للأعمال اللي مش عندها فرق هندسية بس تستاهل نفس المستوى.'
                  : "We're engineers. We knew automation could fix this, but most automation tools were built for enterprises with engineering teams. So we built TwentyFour for the businesses that don't have engineers but deserve enterprise-grade systems."}
              </p>
              <p className="font-medium text-foreground">
                {isAr ? 'إحنا بنبني. هما بياخدوا النتايج.' : 'We do the building. They get the results.'}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* What We Believe (merged values) */}
      <section className="py-16 lg:py-24">
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

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6 text-foreground">
              {isAr ? (
                <>مستعد تشوف إيه اللي نقدر <span className="text-amber-500">نأتمته</span>؟</>
              ) : (
                <>Ready to see what we can <span className="text-amber-500">automate</span>?</>
              )}
            </h2>
            <Link href="/get-started" className="btn-gold inline-flex text-base px-8 py-3">
              {isAr ? 'احصل على خطة مجانية' : 'Get Your Free Plan'}
              {isAr ? <ChevronRight size={18} className="rotate-180" /> : <ArrowRight size={18} />}
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
      <BookCallButton />
    </div>
  );
}
