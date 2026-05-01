'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { STARTER_PRICE_USD, PRO_PRICE_USD, CUSTOM_PRICE_USD_MIN } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const faqs = [
    {
      q: isAr ? 'هل في تجربة مجانية؟' : 'Is there a free trial?',
      a: isAr
        ? 'مش بالشكل التقليدي. الاستشارة المجانية 5 دقائق هي التجربة — هتعرف بالضبط هنبني إيه وسعره كام قبل ما تدفع أي حاجة.'
        : "Not in the traditional sense. The free 5-minute consultation is your trial — you'll know exactly what we'd build and what it costs before paying anything.",
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
        : "Starter setups typically go live within 1-2 weeks. Pro plans take 2-3 weeks because we train the AI on your business and wire up multiple channels. Custom builds get a specific timeline during your consultation. We never quote you a date we can't hit.",
    },
    {
      q: isAr ? 'هل في استرجاع أموال؟' : 'Do you offer refunds?',
      a: isAr
        ? 'لو ما سلمناش اللي اتفقنا عليه في الاستشارة، بنرجعلك 100% من المبلغ بدون أسئلة.'
        : 'If we do not deliver what we promised in the consultation, we refund 100% — no questions asked.',
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
        : 'Major credit cards via Stripe, bank transfer, or local payment methods depending on your region. We discuss payment in your consultation.',
    },
  ];

  const starterItems = [
    'WhatsApp / SMS booking automation',
    'Automated appointment reminders',
    'Customer database',
    'Daily summary reports',
    '1 communication channel',
    'Email support',
  ];
  const proItems = [
    'Everything in Starter',
    'Multi-channel automation (WhatsApp + SMS + Instagram + Email)',
    'AI customer support trained on your FAQs',
    'Lead capture and follow-up sequences',
    'Real-time dashboard with team access',
    'Up to 3 team members',
    'Priority WhatsApp support',
  ];
  const customItems = [
    'Everything in Pro',
    'Custom AI agents trained on your specific business',
    'Integration with existing tools (CRM, EHR, accounting, etc.)',
    'Custom workflow design',
    'Unlimited team members',
    'Dedicated account manager',
    'SLA-backed support',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <section className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3">{isAr ? 'أسعار شهرية بسيطة. ألغي في أي وقت.' : 'Simple monthly pricing. Cancel anytime.'}</h1>
          <p className="text-muted-foreground">{isAr ? 'كل الباقات بتشمل أونبوردنج شخصي، دعم مستمر، وتعديلات غير محدودة.' : 'All plans include personal onboarding, ongoing support, and unlimited adjustments.'}</p>
        </section>

        <section className="grid lg:grid-cols-3 gap-4 mb-10">
          <Card className="border-border bg-card">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Starter</h2>
              <p className="text-3xl font-bold text-foreground">${STARTER_PRICE_USD}<span className="text-sm text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">For small businesses just starting to automate</p>
              <ul className="text-sm space-y-2 text-muted-foreground">{starterItems.map((item) => <li key={item}>✓ {item}</li>)}</ul>
              <Button className="w-full" nativeButton={false} render={<Link href="/get-started?plan=starter" />}>Start with Starter</Button>
            </CardContent>
          </Card>

          <Card className="border-amber-500 bg-card">
            <CardContent className="p-6 space-y-4">
              <Badge className="bg-amber-500 text-black">Most Popular</Badge>
              <h2 className="text-xl font-bold">Pro</h2>
              <p className="text-3xl font-bold text-foreground">${PRO_PRICE_USD}<span className="text-sm text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">For growing teams ready to fully automate operations</p>
              <ul className="text-sm space-y-2 text-muted-foreground">{proItems.map((item) => <li key={item}>✓ {item}</li>)}</ul>
              <Button className="w-full bg-amber-500 text-black hover:bg-amber-400" nativeButton={false} render={<Link href="/get-started?plan=pro" />}>Start with Pro</Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Custom</h2>
              <p className="text-3xl font-bold text-foreground">From ${CUSTOM_PRICE_USD_MIN}</p>
              <p className="text-sm text-muted-foreground">For complex workflows that do not fit a template</p>
              <ul className="text-sm space-y-2 text-muted-foreground">{customItems.map((item) => <li key={item}>✓ {item}</li>)}</ul>
              <Button className="w-full" variant="outline" nativeButton={false} render={<Link href="/get-started?plan=custom" />}>Talk to Sales</Button>
            </CardContent>
          </Card>
        </section>

        <section className="mb-10">
          <Card className="border-border bg-card">
            <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? 'السعر بيغطي السوفت وير، البنية التحتية للـ AI، الدعم، والوقت اللي بنقضيه في بناء وضبط سير العمل بتاعك. بعض القنوات ليها تكاليف خارجية بنمررها بسعرها — رسوم واتساب بيزنس API، رسوم بوابات SMS (تويليو أو ما يعادلها)، وغيرها. بنوضحلك دي كلها في الاستشارة عشان مفيش مفاجآت في الفاتورة.'
                : 'Pricing covers our software, AI infrastructure, support, and the time we spend building and tuning your workflows. Some channels have third-party costs we pass through at our cost — WhatsApp Business API per-conversation fees, SMS gateway fees (Twilio or equivalent), and similar. These are always disclosed on the consultation call so there are no surprises on your bill.'}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3 mb-10">
          {faqs.map((faq) => (
            <Card key={faq.q} className="border-border bg-card">
              <CardContent className="p-5">
                <p className="font-semibold text-foreground mb-2">{faq.q}</p>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="text-center">
          <p className="text-muted-foreground mb-4">{isAr ? 'مش متأكد من الباقة؟ الاستشارة هتوضح لك.' : 'Not sure which plan? The consultation will tell you.'}</p>
          <Button nativeButton={false} render={<Link href="/get-started" />}>{isAr ? 'احصل على توصيات مجانية' : 'Get Free Recommendations'}</Button>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

