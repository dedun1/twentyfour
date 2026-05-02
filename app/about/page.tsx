'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Footer } from '@/components/layout/Footer';
import { BookCallButton } from '@/components/layout/BookCallButton';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const STORY_EN = `TwentyFour started because we lived the problem. We ran service businesses where growth meant drowning in manual work: answering the same customer questions, copying data between apps, chasing no-shows, logging orders by hand.

Every tool we tried was either too generic or too expensive. The ones that worked needed a full-time engineer to maintain. So we built what we wished existed: custom automation designed around how each business actually operates, set up by people who understand operations, priced fairly.

We are not a software company that sells licenses. We study your business, build your system, and keep it running. You focus on customers. We handle the rest.`;

const STORY_AR = `بدأت TwentyFour لأننا عشنا المشكلة. شغّلنا أعمال خدمات كانت النمو فيها يعني الغرق في الشغل اليدوي: الإجابة على نفس أسئلة العملاء، نقل البيانات بين التطبيقات، مطاردة الغائبين، وتسجيل الطلبات يدوياً.

كل أداة جرّبناها كانت إما عامة جداً أو غالية جداً. اللي كان يشتغل كان يحتاج مهندس بدوام كامل عشان يصونه. فبنينا اللي كنا نتمنى يكون موجوداً: أتمتة مخصصة حول طريقة تشغيل كل عمل، من ناس تفهم العمليات، بتسعير عادل.

إحنا مش شركة برمجيات تبيع تراخيص. بندرس عملك، نبني نظامك، ونخليه شغال. أنت تركز على العملاء. وإحنا نهتم بالباقي.`;

const BELIEFS_EN = [
  {
    title: 'Results over features',
    body: "We measure success by what changes in your business, not by how many features we ship. If it does not save you time or money, we do not build it.",
  },
  {
    title: 'Partnership over vendor',
    body: 'We embed with your team. We learn your operations. We are not selling software from a distance. We are building your system alongside you.',
  },
  {
    title: 'Simplicity over complexity',
    body: 'The best automation is the kind your team actually uses. We build simple, reliable systems that work from day one, not science projects.',
  },
  {
    title: 'Transparency over promises',
    body: 'We quote after we understand. We show our math. We tell you what will work and what will not before you pay anything.',
  },
];

const BELIEFS_AR = [
  {
    title: 'النتائج أهم من الميزات',
    body: 'نجاحنا يُقاس بما يتغير في عملك، لا بعدد الميزات. لو مش هيوفرلك وقت أو فلوس، مش هنبنيه.',
  },
  {
    title: 'شراكة أهم من مورّد',
    body: 'بنندمج مع فريقك وبنتعلم تشغيلك. مش بنبيع سوفت وير عن بُعد. بنبني نظامك معاك.',
  },
  {
    title: 'البساطة أهم من التعقيد',
    body: 'أحسن أتمتة هي اللي فريقك يستخدمها فعلاً. بنبني أنظمة بسيطة وموثوقة تشتغل من أول يوم، مش تجارب معملية.',
  },
  {
    title: 'الشفافية أهم من الوعود',
    body: 'بنحدد السعر بعد ما نفهم. بنوري الحساب. بنقولك إيه اللي هيشتغل وإيه اللي مش هيشتغل قبل ما تدفع.',
  },
];

const FOUNDER_1_EN = { name: 'Eyad Khalil', role: 'Co-Founder', quote: 'Ran service businesses, felt the pain of manual operations firsthand. Built TwentyFour to fix what off-the-shelf tools could not.' };
const FOUNDER_2_EN = { name: 'Adham Ehab', role: 'Co-Founder', quote: 'Spent years building systems for businesses that deserved better tooling. TwentyFour is what happens when engineering meets real operations.' };
const FOUNDER_1_AR = { name: 'إياد خليل', role: 'شريك مؤسس', quote: FOUNDER_1_EN.quote };
const FOUNDER_2_AR = { name: 'أدهم إيهاب', role: 'شريك مؤسس', quote: FOUNDER_2_EN.quote };

export default function AboutPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const beliefs = isAr ? BELIEFS_AR : BELIEFS_EN;
  const founders = isAr
    ? [FOUNDER_1_AR, FOUNDER_2_AR]
    : [FOUNDER_1_EN, FOUNDER_2_EN];

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-8 lg:pt-12">
        {/* Section 1 — Hero */}
        <section className="hero-gradient py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                {isAr ? (
                  <>بنبني <span className="text-amber-500">أنظمة</span> عشان أنت ما تبنيهاش</>
                ) : (
                  <>
                    We Build <span className="text-amber-500">Systems</span> So You Don&apos;t Have To
                  </>
                )}
              </h1>
              <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
                {isAr
                  ? 'TwentyFour بتبني أتمتة مخصصة للأعمال اللي عايزة تنمو من غير ما تكبّر فريقها.'
                  : 'TwentyFour creates custom automation for businesses that want to grow without growing their team.'}
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Section 2 — Our Story */}
        <section className="bg-muted/30 py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center text-foreground mb-6">
                {isAr ? (
                  <>
                    قصت<span className="text-amber-500">نا</span>
                  </>
                ) : (
                  <>
                    Our <span className="text-amber-500">Story</span>
                  </>
                )}
              </h2>
              <div className="max-w-3xl mx-auto space-y-4 text-muted-foreground leading-relaxed whitespace-pre-line">
                {isAr ? STORY_AR : STORY_EN}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Section 3 — Who We Are */}
        <section className="bg-background py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center text-foreground mb-10">
                {isAr ? (
                  <>مين <span className="text-amber-500">إحنا</span></>
                ) : (
                  <>
                    Who We <span className="text-amber-500">Are</span>
                  </>
                )}
              </h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {founders.map((f) => (
                  <div key={f.name} className="rounded-xl bg-card shadow-sm border-0 p-8 text-center space-y-4">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-amber-500/20 text-2xl font-bold text-amber-700 dark:text-amber-400">
                      {f.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{f.name}</p>
                      <p className="text-sm text-muted-foreground">{f.role}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed text-start">{f.quote}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Section 4 — What We Believe */}
        <section className="bg-muted/30 py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-3xl font-bold text-center text-foreground mb-10">
                {isAr ? (
                  <>إيه اللي <span className="text-amber-500">نؤمن</span> بيه</>
                ) : (
                  <>
                    What We <span className="text-amber-500">Believe</span>
                  </>
                )}
              </h2>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {beliefs.map((b, i) => (
                <ScrollReveal key={b.title} delay={i * 100}>
                  <div className="rounded-xl bg-card shadow-sm border-0 p-6 h-full">
                    <h3 className="font-bold text-foreground mb-3">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 — CTA */}
        <section className="bg-background py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {isAr ? 'مستعد تشوف إيه اللي نقدر نأتمته لعملك؟' : 'Ready to see what we can automate for your business?'}
                </h2>
                <Button
                  nativeButton={false}
                  render={<Link href="/get-started" />}
                  className="rounded-xl bg-amber-500 text-black font-semibold shadow-sm hover:bg-amber-400 px-8 py-6 text-lg"
                >
                  {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
      <Footer />
      <BookCallButton />
    </div>
  );
}
