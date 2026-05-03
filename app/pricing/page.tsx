'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Footer } from '@/components/layout/Footer';
import { BookCallButton } from '@/components/layout/BookCallButton';
import { STARTER_PRICE_USD, PRO_PRICE_USD, CUSTOM_PRICE_USD_MIN } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export default function PricingPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const faqs = [
    {
      q: isAr ? 'هل في تجربة مجانية؟' : 'Is there a free trial?',
      a: isAr
        ? 'مش بالشكل التقليدي. الاستشارة المجانية 5 دقائق هي التجربة. هتعرف بالضبط هنبني إيه وسعره كام قبل ما تدفع أي حاجة.'
        : "Not in the traditional sense. The free 5-minute consultation is your trial. You'll know exactly what we'd build and what it costs before paying anything.",
    },
    {
      q: isAr ? 'أقدر أغير الباقة بعدين؟' : 'Can I change plans later?',
      a: isAr
        ? 'أيوه، في أي وقت. الترقية فورية. التخفيض يبدأ مع دورة الفوترة الجاية.'
        : 'Yes, anytime. Upgrades happen instantly. Downgrades take effect at the next billing cycle.',
    },
    {
      q: isAr ? 'إمتى هكون شغّال؟' : 'How long until I am live?',
      a: isAr
        ? 'Starter بيشتغل عادةً خلال أسبوع لأسبوعين. Pro بياخد من 2 لـ 3 أسابيع عشان بندرّب الـ AI على عملك وبنوصّل قنوات متعددة. الأتمتة المخصصة بياخد وقتها حسب التفاصيل، وبنحدد ميعاد دقيق في الاستشارة. ما بنوعدك بميعاد ما نقدرش نوصله.'
        : "Starter setups typically go live within 1-2 weeks. Pro plans take 2-3 weeks because we train the AI on your business and wire up multiple channels. Custom builds get a specific timeline during your consultation. We never quote a date we can't hit.",
    },
    {
      q: isAr ? 'هل في استرجاع أموال؟' : 'Do you offer refunds?',
      a: isAr
        ? 'لو ما سلمناش اللي اتفقنا عليه في الاستشارة، بنرجعلك 100% من المبلغ بدون أسئلة.'
        : 'If we do not deliver what we promised in the consultation, we refund 100%. No questions asked.',
    },
    {
      q: isAr ? 'لو محتاج حاجة مخصصة؟' : 'What if I need something custom?',
      a: isAr
        ? 'ده بالضبط دور باقة Custom. أفضل شغلنا بيكون مخصص حسب البيزنس.'
        : 'That is exactly what the Custom plan is for. Most of our best work is custom.',
    },
    {
      q: isAr ? 'إزاي الدفع؟' : 'How do I pay?',
      a: isAr
        ? 'بطاقات ائتمان عبر Stripe، تحويل بنكي، أو وسائل دفع محلية حسب منطقتك. بنأكد طريقة الدفع في الاستشارة.'
        : 'Major credit cards via Stripe, bank transfer, or local payment methods depending on your region. We confirm payment details during your consultation.',
    },
  ];

  const starterItems = isAr
    ? ['أتمتة حجوزات SMS', 'تذكيرات مواعيد أوتوماتيكية', 'قاعدة بيانات عملاء', 'تقارير يومية ملخصة', 'قناة تواصل واحدة', 'دعم عبر الإيميل']
    : ['SMS booking automation', 'Automated appointment reminders', 'Customer database', 'Daily summary reports', '1 communication channel', 'Email support'];

  const proItems = isAr
    ? ['كل حاجة في Starter', 'أتمتة متعددة القنوات (SMS + Instagram + Email + ويب شات)', 'دعم عملاء AI متدرب على أسئلتك', 'جذب عملاء ومتابعات أوتوماتيكية', 'لوحة تحكم لحظية مع وصول للفريق', 'حتى 3 أعضاء فريق', 'دعم أولوية']
    : ['Everything in Starter', 'Multi-channel automation (SMS + Instagram + Email + web chat)', 'AI customer support trained on your FAQs', 'Lead capture and follow-up sequences', 'Real-time dashboard with team access', 'Up to 3 team members', 'Priority support'];

  const customItems = isAr
    ? ['كل حاجة في Pro', 'AI agents مخصصة متدربة على بيزنسك', 'ربط مع أدواتك الحالية (CRM, EHR, محاسبة, إلخ)', 'تصميم سير عمل مخصص', 'أعضاء فريق بلا حدود', 'مدير حساب مخصص', 'دعم بضمان SLA']
    : ['Everything in Pro', 'Custom AI agents trained on your specific business', 'Integration with existing tools (CRM, EHR, accounting, etc.)', 'Custom workflow design', 'Unlimited team members', 'Dedicated account manager', 'SLA-backed support'];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-8 lg:pt-12 max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <ScrollReveal>
          <section className="text-center mb-12 hero-gradient py-12 rounded-2xl">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {isAr ? (
                <>أسعار شهرية <span className="text-amber-500">بسيطة</span>. ألغي في أي وقت.</>
              ) : (
                <>Simple <span className="text-amber-500">monthly</span> pricing. Cancel anytime.</>
              )}
            </h1>
            <p className="text-muted-foreground">
              {isAr ? 'كل الباقات بتشمل أونبوردنج شخصي، دعم مستمر، وتعديلات غير محدودة.' : 'All plans include personal onboarding, ongoing support, and unlimited adjustments.'}
            </p>
          </section>
        </ScrollReveal>

        <section className="grid lg:grid-cols-3 gap-5 mb-12">
          {/* Starter */}
          <ScrollReveal delay={0}>
            <div className="card-hover rounded-xl border border-border bg-card p-6 space-y-4 h-full flex flex-col">
              <h2 className="text-xl font-bold text-foreground">Starter</h2>
              <p className="text-3xl font-bold text-foreground">${STARTER_PRICE_USD}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              <p className="text-sm text-muted-foreground">{isAr ? 'للأعمال الصغيرة اللي بدأت تأتمت' : 'For small businesses just starting to automate'}</p>
              <ul className="text-sm space-y-2 text-muted-foreground flex-1">{starterItems.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{item}</li>)}</ul>
              <Link href="/get-started?plan=starter" className="btn-outline w-full text-center">
                {isAr ? 'ابدأ مع Starter' : 'Start with Starter'}
              </Link>
            </div>
          </ScrollReveal>

          {/* Pro */}
          <ScrollReveal delay={100}>
            <div className="card-hover rounded-xl border-2 border-amber-500 bg-card p-6 space-y-4 h-full flex flex-col relative">
              <Badge className="absolute -top-3 left-6 bg-amber-500 text-black">{isAr ? 'الأكثر شعبية' : 'Most Popular'}</Badge>
              <h2 className="text-xl font-bold text-foreground">Pro</h2>
              <p className="text-3xl font-bold text-foreground">${PRO_PRICE_USD}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              <p className="text-sm text-muted-foreground">{isAr ? 'للفرق النامية الجاهزة لأتمتة كاملة' : 'For growing teams ready to fully automate operations'}</p>
              <ul className="text-sm space-y-2 text-muted-foreground flex-1">{proItems.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{item}</li>)}</ul>
              <Link href="/get-started?plan=pro" className="btn-gold w-full text-center">
                {isAr ? 'ابدأ مع Pro' : 'Start with Pro'}
              </Link>
            </div>
          </ScrollReveal>

          {/* Custom */}
          <ScrollReveal delay={200}>
            <div className="card-hover rounded-xl border border-border bg-card p-6 space-y-4 h-full flex flex-col">
              <h2 className="text-xl font-bold text-foreground">Custom</h2>
              <p className="text-3xl font-bold text-foreground">{isAr ? `من $${CUSTOM_PRICE_USD_MIN}` : `From $${CUSTOM_PRICE_USD_MIN}`}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'لسير العمل المعقد اللي ما بيناسبش قالب جاهز' : 'For complex workflows that need a tailored solution'}</p>
              <ul className="text-sm space-y-2 text-muted-foreground flex-1">{customItems.map((item) => <li key={item} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{item}</li>)}</ul>
              <Link href="/get-started?plan=custom" className="btn-outline w-full text-center">
                {isAr ? 'تكلم مع المبيعات' : 'Talk to Sales'}
              </Link>
            </div>
          </ScrollReveal>
        </section>

        <ScrollReveal>
          <section className="mb-12">
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'السعر بيغطي السوفت وير، البنية التحتية للـ AI، الدعم، والوقت اللي بنقضيه في بناء وضبط سير العمل بتاعك. بعض القنوات ليها تكاليف خارجية بنمررها بسعرها (مثل رسوم بوابات SMS). بنوضحلك دي كلها في الاستشارة عشان مفيش مفاجآت.'
                : 'Pricing covers our software, AI infrastructure, support, and the time we spend building and tuning your workflows. Some channels have third-party costs we pass through at our cost (e.g. SMS gateway fees). These are always disclosed on the consultation call so there are no surprises.'}
            </div>
          </section>
        </ScrollReveal>

        <section className="space-y-3 mb-12">
          <ScrollReveal>
            <h2 className="text-2xl font-bold text-center text-foreground mb-6">
              {isAr ? (
                <>أسئلة <span className="text-amber-500">شائعة</span></>
              ) : (
                <>Frequently <span className="text-amber-500">Asked</span></>
              )}
            </h2>
          </ScrollReveal>
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.q} delay={i * 60}>
              <div className="card-hover rounded-xl border border-border bg-card p-5">
                <p className="font-semibold text-foreground mb-2">{faq.q}</p>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            </ScrollReveal>
          ))}
        </section>

        <ScrollReveal>
          <section className="text-center">
            <p className="text-muted-foreground mb-4">{isAr ? 'مش متأكد من الباقة؟ الاستشارة هتوضح لك.' : 'Not sure which plan? The consultation will tell you.'}</p>
            <Link href="/get-started" className="btn-gold inline-flex px-8 py-3">
              {isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}
            </Link>
          </section>
        </ScrollReveal>
      </main>
      <Footer />
      <BookCallButton />
    </div>
  );
}
