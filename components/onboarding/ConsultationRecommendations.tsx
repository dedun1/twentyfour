import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { MessageCircle, RefreshCw, Rocket } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { SUPPORT_WHATSAPP } from '@/lib/constants';
import { COOKIE_NAME } from '@/lib/onboarding-session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Recommendation = {
  title: string;
  problem: string;
  solution: string;
  time_saved_hours_per_month: number;
  estimated_roi: string;
  priority: 'high' | 'medium' | 'low';
  channel: string;
};

type Row = {
  id: string;
  user_id: string | null;
  is_anonymous: boolean;
  language: 'en' | 'ar';
  business_summary: string | null;
  captured_business_name: string | null;
  recommendations: Recommendation[] | null;
  status: string;
};

type RawRecommendation = {
  title?: string;
  problem?: string;
  pain_point?: string;
  description?: string;
  solution?: string;
  what_we_build?: string;
  automation?: string;
  time_saved_hours_per_month?: number;
  hours_saved?: number;
  timeSaved?: number;
  estimated_roi?: string;
  roi?: string;
  value?: string;
  priority?: string;
  channel?: string;
};

function prClass(p: string) {
  if (p === 'high') return 'bg-red-500/15 text-red-500';
  if (p === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-green-500/15 text-green-600 dark:text-green-400';
}

function truncateTitle(s: string, max: number) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export default async function ConsultationRecommendations({
  sessionId,
  homeRedirectPath,
  newConsultationPath,
}: {
  sessionId: string;
  homeRedirectPath: string;
  newConsultationPath: string;
}) {
  if (!sessionId) redirect(homeRedirectPath);

  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data, error } = await supabaseAdmin
    .from('onboarding_sessions')
    .select('id, user_id, is_anonymous, language, business_summary, captured_business_name, recommendations, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) redirect(homeRedirectPath);

  const row = data as Row;

  if (!user && cookieSessionId !== sessionId) redirect(homeRedirectPath);
  if (user && row.user_id && row.user_id !== user.id) {
    const { data: roleRow } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (roleRow?.role !== 'admin') redirect(homeRedirectPath);
  }

  if (row.status !== 'completed') redirect(homeRedirectPath);

  const ar = row.language === 'ar';
  const rawRecs = Array.isArray(row.recommendations) ? (row.recommendations as RawRecommendation[]) : [];
  const recs = rawRecs.map((rec, i) => {
    const hours = rec.time_saved_hours_per_month ?? rec.hours_saved ?? rec.timeSaved ?? 0;
    const problem = rec.problem ?? rec.pain_point ?? rec.description ?? '';
    const solution = rec.solution ?? rec.what_we_build ?? rec.automation ?? '';
    const roi = rec.estimated_roi ?? rec.roi ?? rec.value ?? '';
    const priority = rec.priority ?? 'medium';
    const channel = rec.channel ?? 'WhatsApp';
    const safePriority = priority === 'high' || priority === 'medium' || priority === 'low' ? priority : 'medium';
    const safeChannel =
      channel === 'WhatsApp' || channel === 'SMS' || channel === 'Email' || channel === 'Instagram' || channel === 'Dashboard'
        ? channel
        : 'WhatsApp';

    return {
      title: rec.title?.trim() || (ar ? `توصية ${i + 1}` : `Recommendation ${i + 1}`),
      problem: problem.trim(),
      solution: solution.trim(),
      time_saved_hours_per_month: Number(hours) > 0 ? Number(hours) : 0,
      estimated_roi: roi.trim(),
      priority: safePriority as Recommendation['priority'],
      channel: safeChannel,
    };
  });
  const hasRecs = recs.length > 0;
  const totalHours = recs.reduce((acc, r) => acc + Number(r.time_saved_hours_per_month || 0), 0);
  const totalValue = totalHours * 10;
  const businessName = row.captured_business_name?.trim() || null;
  const recsWithHours = recs.filter((r) => Number(r.time_saved_hours_per_month || 0) > 0);
  const hasHours = totalHours > 0;
  const maxHours = Math.max(...recsWithHours.map((r) => Number(r.time_saved_hours_per_month || 0)), 1);

  const firstTitle = recs[0]?.title ?? '';
  const planMsg = encodeURIComponent(
    `Hi TwentyFour! I just completed the AI consultation and I'm ready to get started. Here's my plan: ${firstTitle}`
  );
  const questionsMsg = encodeURIComponent(
    'Hi TwentyFour, I completed the consultation and have some questions.'
  );
  const startHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${planMsg}`;
  const talkHref = `https://wa.me/${SUPPORT_WHATSAPP}?text=${questionsMsg}`;

  const heroTitle = ar ? 'خطة الأتمتة المخصصة لك' : 'Your Custom Automation Plan';
  const heroWithBusiness = businessName
    ? ar
      ? `إليك ما سنبنيه لـ ${businessName}`
      : `Here's what we'd build for ${businessName}`
    : null;
  const heroSub = ar
    ? 'بناءً على محادثتنا، هذه الأتمتة التي ستُحدث أكبر أثر في عملك.'
    : 'Based on our conversation, these automations would have the biggest impact on your business.';

  const preparing = ar
    ? 'جاري تجهيز توصياتك. يُرجى العودة بعد قليل.'
    : 'Your recommendations are being prepared. Check back shortly.';

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <section className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">{heroTitle}</h1>
        {heroWithBusiness ? <p className="text-xl font-semibold text-foreground">{heroWithBusiness}</p> : null}
        <p className="text-muted-foreground max-w-2xl mx-auto">{heroSub}</p>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          {ar
            ? 'حللنا كل ما شاركته وطابقناه مع الأتمتة التي ستصنع أكبر فرق فعلي في عملك. كل توصية أدناه مبنية على طريقة تشغيل عملك.'
            : "We've analyzed everything you shared and matched it to the automations that would make the biggest difference. Each recommendation below is specific to how your business operates."}
        </p>
      </section>

      {!hasRecs ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          {preparing}
        </div>
      ) : (
        <>
          <section className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-8 text-center space-y-2">
            {hasHours ? (
              <>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {ar ? `${totalHours} ساعة توفير شهرياً` : `${totalHours} hours saved per month`}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {ar ? `حوالي $${totalValue} قيمة شهرية` : `~$${totalValue} in monthly value`}
                </p>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto pt-2">
                  {ar
                    ? 'بناءً على متوسط تكلفة العمل $10/ساعة. التوفير الفعلي يعتمد على حجم فريقك.'
                    : 'Based on average labor cost of $10/hour. Actual savings depend on your team size.'}
                </p>
              </>
            ) : (
              <p className="text-xl font-semibold text-foreground">
                {ar ? 'خطتك المخصصة جاهزة. اطلع على الأتمتة أدناه.' : 'Your personalized plan is ready, see the automations below.'}
              </p>
            )}
          </section>

          <section className="space-y-4 max-w-3xl mx-auto">
            {recs.map((rec, i) => (
              <Card key={`${rec.title}-${i}`} className="border-border bg-card rounded-xl">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-xl font-bold text-foreground flex-1 min-w-0">{rec.title}</h2>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Badge className={prClass(rec.priority)}>{rec.priority}</Badge>
                      <Badge variant="secondary">{rec.channel}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      {ar ? 'المشكلة الحالية:' : 'The problem right now:'}
                    </p>
                    <p className="text-sm italic text-muted-foreground">
                      {rec.problem || (ar ? 'تم تحديدها من استشارتك' : 'Identified from your consultation')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                      {ar ? 'ما سنبنيه:' : 'What we build:'}
                    </p>
                    <p className="text-sm text-foreground">
                      {rec.solution || (ar ? 'سير عمل مخصص، والتفاصيل تؤكد في مكالمة الاكتشاف' : 'Custom workflow, details confirmed on discovery call')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-t border-border pt-4">
                    <span>
                      {rec.time_saved_hours_per_month > 0
                        ? ar
                          ? `يوفّر ~${rec.time_saved_hours_per_month} ساعة/شهر`
                          : `Saves ~${rec.time_saved_hours_per_month} hrs/month`
                        : ar
                          ? 'سيتم احتساب التوفير الزمني بدقة في مكالمة الاكتشاف'
                          : 'Time savings calculated on discovery call'}
                    </span>
                    <span className="font-medium text-foreground">
                      {rec.estimated_roi || (ar ? 'العائد المالي يحدد بعد مراجعة الأحجام الدقيقة' : 'ROI confirmed after exact volume review')}
                    </span>
                    <Badge variant="secondary">{rec.channel}</Badge>
                    <Badge className={prClass(rec.priority)}>{rec.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {recsWithHours.length > 0 ? (
            <section className="max-w-3xl mx-auto space-y-4">
              <h3 className="text-lg font-semibold text-foreground text-center">
                {ar ? 'الوقت الموفر لكل أتمتة (ساعات/شهر)' : 'Time saved per automation (hours/month)'}
              </h3>
              <div className="space-y-3">
                {recsWithHours.map((rec, i) => {
                  const h = Number(rec.time_saved_hours_per_month || 0);
                  const pct = Math.round((h / maxHours) * 100);
                  return (
                    <div key={`bar-${rec.title}-${i}`} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_160px] gap-2 sm:gap-4 items-center text-sm">
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="truncate text-muted-foreground" title={rec.title}>
                          {truncateTitle(rec.title, 30)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 dark:bg-amber-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-muted-foreground w-20 text-end shrink-0">{h} hrs/mo</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
              {ar
                ? 'سيتم احتساب التوفير الزمني بدقة خلال مكالمة الاكتشاف بناءً على أحجامك الفعلية.'
                : 'Precise time savings will be calculated on your discovery call based on your exact volumes.'}
            </section>
          )}

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-foreground">
              {hasHours
                ? ar
                  ? `جاهز لتوفير ${totalHours} ساعة شهرياً؟`
                  : `Ready to start saving ${totalHours} hours a month?`
                : ar
                  ? 'جاهز لرؤية هذه الخطة على أرض الواقع؟'
                  : 'Ready to see this plan come to life?'}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-amber-400 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40">
                <CardContent className="p-6 flex flex-col gap-3 h-full">
                  <Rocket className="size-8 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-semibold text-lg">{ar ? 'لنبدأ' : "Let's get started"}</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    {ar
                      ? 'نُعدّ كل شيء في خطتك. معظم العملاء يبدأون خلال أسبوعين.'
                      : "We'll set up everything in your plan. Most clients go live within 2 weeks."}
                  </p>
                  <Button
                    nativeButton={false}
                    className="w-full bg-amber-500 text-black hover:bg-amber-400"
                    render={<a href={startHref} target="_blank" rel="noopener noreferrer" />}
                  >
                    {ar ? 'ابدأ بهذه الخطة →' : 'Start with this plan →'}
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-6 flex flex-col gap-3 h-full">
                  <MessageCircle className="size-8 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{ar ? 'تحدث معنا أولاً' : 'Talk to us first'}</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    {ar
                      ? 'لديك أسئلة قبل الالتزام؟ راسلنا على واتساب دون ضغط بيع.'
                      : 'Have questions before committing? Chat with us on WhatsApp, no sales pressure.'}
                  </p>
                  <Button
                    variant="outline"
                    nativeButton={false}
                    className="w-full"
                    render={<a href={talkHref} target="_blank" rel="noopener noreferrer" />}
                  >
                    {ar ? 'راسلنا على واتساب' : 'Message us on WhatsApp'}
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-border border-dashed">
                <CardContent className="p-6 flex flex-col gap-3 h-full">
                  <RefreshCw className="size-8 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{ar ? 'استشارة جديدة' : 'Start a new consultation'}</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    {ar
                      ? 'تريد استكشاف زاوية أو عمل مختلف؟'
                      : 'Want to explore a different angle or business?'}
                  </p>
                  <Button
                    variant="ghost"
                    nativeButton={false}
                    className="w-full"
                    render={<Link href={newConsultationPath} />}
                  >
                    {ar ? 'استشارة جديدة' : 'New consultation'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
              {ar ? 'ماذا بعد؟' : 'What happens next'}
            </h2>
            <div className="relative flex flex-col md:flex-row md:justify-between gap-8 md:gap-4 max-w-4xl mx-auto">
              <div className="hidden md:block absolute top-5 left-[12%] right-[12%] h-0.5 bg-amber-300 dark:bg-amber-800 z-0" aria-hidden />
              {[
                {
                  title: ar ? 'مكالمة اكتشاف' : 'Discovery call',
                  body: ar
                    ? 'مكالمة 30 دقيقة لتأكيد خطتك والإجابة عن الأسئلة'
                    : '30-minute call to confirm your plan and answer questions',
                },
                {
                  title: ar ? 'نبني نظامك' : 'We build your system',
                  body: ar
                    ? 'سير عمل مخصص وبناء واختبار. عادةً 1-2 أسبوع.'
                    : 'Custom workflows built and tested. Usually 1-2 weeks.',
                },
                {
                  title: ar ? 'تنطلق' : 'You go live',
                  body: ar
                    ? 'تبدأ بتوفير الوقت من اليوم الأول. نبقى معك للدعم.'
                    : 'Start saving time from day one. We stay on for ongoing support.',
                },
              ].map((step, idx) => (
                <div key={step.title} className="flex md:flex-col items-start md:items-center gap-4 md:text-center flex-1 z-10">
                  <div className="flex flex-col md:items-center gap-2 w-full md:w-auto">
                    <div className="size-10 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 border-4 border-background">
                      {idx + 1}
                    </div>
                    {idx < 2 ? (
                      <div className="md:hidden w-px flex-1 min-h-[24px] ms-5 -mt-1 border-s-2 border-dashed border-amber-300 dark:border-amber-700" />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-2 md:pb-0">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
