import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  CheckCircle2,
  ChevronRight,
  Shield,
  TrendingUp,
  XCircle,
  Clock,
  MessageCircle,
  Rocket,
  RefreshCw,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/onboarding-session';
import { SUPPORT_WHATSAPP } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type RawRecommendation = {
  title?: string;
  problem?: string;
  pain_point?: string;
  description?: string;
  solution?: string;
  what_we_build?: string;
  automation?: string;
  current_pain?: string;
  after_state?: string;
  impact_metric?: {
    metric_name?: string;
    before?: string;
    after?: string;
    unit?: string;
  };
  time_saved_hours_per_month?: number;
  hours_saved?: number;
  timeSaved?: number;
  estimated_roi?: string;
  roi?: string;
  value?: string;
  priority?: string;
  channel?: string;
};

type SessionRow = {
  id: string;
  user_id: string | null;
  captured_business_name: string | null;
  status: string;
  business_summary?: string | null;
  monthly_revenue_at_risk?: number | null;
  recommendations?: RawRecommendation[] | null;
};

function priorityClass(p: string) {
  if (p === 'high') return 'bg-red-500/15 text-red-500';
  if (p === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = sp.session;
  if (!sessionId) redirect('/get-started');

  const supabase = await createClient();
  const admin = createAdminClient();
  const cookieStore = await cookies();
  const cookieSessionId = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data, error } = await admin
    .from('onboarding_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) redirect('/get-started');
  const session = data as SessionRow;

  if (!user && cookieSessionId !== sessionId) redirect('/get-started');
  if (user && session.user_id && session.user_id !== user.id) {
    const { data: roleRow } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (roleRow?.role !== 'admin') redirect('/get-started');
  }

  if (session.status !== 'completed') redirect('/get-started');

  const businessName = session.captured_business_name?.trim() || 'your business';
  const rawRecs = Array.isArray(session.recommendations) ? session.recommendations : [];
  const recommendations = rawRecs.map((rec, i) => {
    const metric = rec.impact_metric ?? { metric_name: 'Time spent', before: 'Manual', after: 'Automated', unit: '' };
    const hours = Number(rec.time_saved_hours_per_month ?? rec.hours_saved ?? rec.timeSaved ?? 4);
    const problem = rec.problem ?? rec.pain_point ?? rec.description ?? '';
    const solution = rec.solution ?? rec.what_we_build ?? rec.automation ?? '';
    const roi = rec.estimated_roi ?? rec.roi ?? rec.value ?? `$${Math.max(40, Math.round(hours * 10))}/mo saved`;
    const currentPain = rec.current_pain ?? rec.problem ?? 'Manual process taking time';
    const afterState = rec.after_state ?? rec.solution ?? 'Automated workflow';
    const priority = rec.priority === 'high' || rec.priority === 'medium' || rec.priority === 'low' ? rec.priority : 'medium';
    const channel = rec.channel || 'WhatsApp';

    return {
      title: rec.title || `Recommendation ${i + 1}`,
      problem,
      solution,
      currentPain,
      afterState,
      metric: {
        metric_name: metric.metric_name || 'Time spent',
        before: metric.before || 'Manual',
        after: metric.after || 'Automated',
        unit: metric.unit || '',
      },
      hours: Number.isFinite(hours) && hours > 0 ? Math.round(hours) : 4,
      roi,
      priority,
      channel,
    };
  });

  const totalHours = recommendations.reduce((sum, r) => sum + r.hours, 0);
  const totalValue = totalHours * 10;
  const atRisk = Number(session.monthly_revenue_at_risk ?? (totalHours * 15));
  const costOfDoingNothing = totalValue + atRisk;
  const yearlySavings = totalValue * 12;
  const monthlySavings = totalValue;
  const maxYearValue = Math.max(monthlySavings * 12, 1);
  const startMsg = encodeURIComponent(
    `Hi TwentyFour! I just completed my consultation. I want to book the discovery call to start saving $${totalValue}/month.`
  );
  const questionMsg = encodeURIComponent('Hi TwentyFour, I completed my consultation and I have a few questions first.');

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <section className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-foreground">Your Custom Automation Plan</h1>
        <p className="text-xl text-foreground">Here&apos;s what we&apos;d build for {businessName}</p>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Based on what you shared, here&apos;s exactly what&apos;s costing you money right now - and what your business looks like once we automate it.
        </p>
      </section>

      <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-8 space-y-5">
        <h2 className="text-2xl font-bold text-foreground text-center">What manual work is costing you right now</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-red-200 dark:border-red-900"><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-red-600 dark:text-red-400">{totalHours} hours/month</p><p className="text-sm text-muted-foreground mt-1">lost to manual work</p></CardContent></Card>
          <Card className="border-red-200 dark:border-red-900"><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-red-600 dark:text-red-400">${atRisk}</p><p className="text-sm text-muted-foreground mt-1">in monthly revenue at risk</p></CardContent></Card>
          <Card className="border-red-200 dark:border-red-900"><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-red-600 dark:text-red-400">${costOfDoingNothing}</p><p className="text-sm text-muted-foreground mt-1">total monthly cost of doing nothing</p></CardContent></Card>
        </div>
        <p className="text-sm text-center text-muted-foreground">Every month you wait, that&apos;s money you don&apos;t get back.</p>
      </section>

      <section className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-8 space-y-5">
        <h2 className="text-2xl font-bold text-foreground text-center">What changes with TwentyFour</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900"><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalHours} hours/month</p><p className="text-sm text-muted-foreground mt-1">back in your team&apos;s hands</p></CardContent></Card>
          <Card className="border-emerald-200 dark:border-emerald-900"><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${totalValue}</p><p className="text-sm text-muted-foreground mt-1">saved in monthly costs</p></CardContent></Card>
          <Card className="border-emerald-200 dark:border-emerald-900"><CardContent className="p-5 text-center"><p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${yearlySavings}</p><p className="text-sm text-muted-foreground mt-1">annual savings, year one</p></CardContent></Card>
        </div>
        <p className="text-sm text-center text-muted-foreground">Most clients see results in their first 2 weeks.</p>
      </section>

      <section className="max-w-4xl mx-auto"><Card className="border-border bg-card"><CardContent className="p-6"><p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">What you shared with us</p><blockquote className="text-base italic text-foreground leading-relaxed">“{session.business_summary || 'We reviewed your consultation details and built this plan around your specific operations and constraints.'}”</blockquote></CardContent></Card></section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-foreground">How we&apos;ll transform your operations</h2>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.title} className="rounded-xl border-border">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold text-foreground">{rec.title}</h3><div className="flex flex-wrap gap-2"><Badge variant="secondary">{rec.channel}</Badge><Badge className={priorityClass(rec.priority)}>{rec.priority}</Badge></div></div>
                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                  <div className="bg-red-50/50 dark:bg-red-950/10 rounded-xl p-4 border border-red-200/60 dark:border-red-900/60 space-y-3"><div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm"><XCircle className="size-4" />TODAY</div><p className="text-sm text-foreground">{rec.currentPain}</p><p className="text-xs text-muted-foreground">{rec.problem || 'Identified from your consultation'}</p><p className="text-xs font-medium text-red-700 dark:text-red-300">Currently: {rec.metric.metric_name} = {rec.metric.before}</p></div>
                  <div className="flex md:flex-col items-center justify-center gap-2"><ChevronRight className="size-8 text-amber-500 hidden md:block" /><ChevronRight className="size-8 text-amber-500 rotate-90 md:hidden" /><span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-1">+{rec.hours} hrs/mo</span></div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-4 border border-emerald-200/60 dark:border-emerald-900/60 space-y-3"><div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm"><CheckCircle2 className="size-4" />WITH TWENTYFOUR</div><p className="text-sm text-foreground">{rec.afterState}</p><p className="text-xs text-muted-foreground">{rec.solution || 'Custom workflow - details confirmed on discovery call'}</p><p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">After: {rec.metric.metric_name} = {rec.metric.after}</p></div>
                </div>
                <div className="flex justify-end"><Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">{rec.roi}</Badge></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4"><h2 className="text-2xl font-bold text-center text-foreground">Your savings compound every month</h2><div className="rounded-2xl border border-border p-4 overflow-x-auto"><div className="min-w-[760px]"><div className="text-right mb-2 text-sm font-semibold text-amber-700 dark:text-amber-300">Year 1 total: ${monthlySavings * 12}</div><div className="flex items-end gap-2 h-[280px]">{Array.from({ length: 12 }, (_, i) => {const monthIndex = i + 1; const monthValue = monthlySavings * monthIndex; const heightPx = Math.max(12, Math.round((monthValue / maxYearValue) * 240)); return (<div key={monthIndex} className="flex-1 min-w-[48px] flex flex-col items-center justify-end gap-2">{monthIndex === 3 ? (<span className="text-[10px] text-amber-700 dark:text-amber-300 text-center">Setup pays for itself</span>) : monthIndex === 6 ? (<span className="text-[10px] text-amber-700 dark:text-amber-300 text-center">${monthlySavings * 6} saved</span>) : (<span className="text-[10px] text-transparent select-none">.</span>)}<div className="w-full rounded-t-md bg-gradient-to-t from-amber-300 to-amber-500" style={{ height: `${heightPx}px` }} /><span className="text-xs text-muted-foreground">M{monthIndex}</span></div>);})}</div></div></div></section>

      <section className="grid md:grid-cols-3 gap-4"><Card><CardContent className="p-5 space-y-2"><TrendingUp className="size-6 text-amber-500" /><p className="font-semibold text-foreground">Conservative estimates</p><p className="text-sm text-muted-foreground">Numbers above use industry benchmarks. Most clients see better results.</p></CardContent></Card><Card><CardContent className="p-5 space-y-2"><Clock className="size-6 text-amber-500" /><p className="font-semibold text-foreground">Live in 2 weeks</p><p className="text-sm text-muted-foreground">Full setup, training, and handoff. You start saving immediately.</p></CardContent></Card><Card><CardContent className="p-5 space-y-2"><Shield className="size-6 text-amber-500" /><p className="font-semibold text-foreground">We deliver or refund</p><p className="text-sm text-muted-foreground">If we don&apos;t build what&apos;s promised in your discovery call, you pay nothing.</p></CardContent></Card></section>

      <section className="space-y-6"><div className="text-center space-y-2"><h2 className="text-2xl font-bold text-foreground">Ready to stop losing ${totalValue}/month?</h2><p className="text-muted-foreground max-w-3xl mx-auto">Book your discovery call. We&apos;ll confirm the plan, lock in your timeline, and answer every question - no commitment until you&apos;re 100% sure.</p></div><div className="grid md:grid-cols-3 gap-4"><Card className="border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/40"><CardContent className="p-6 space-y-3"><Rocket className="size-7 text-amber-600 dark:text-amber-400" /><p className="font-semibold text-foreground">Book my discovery call</p><p className="text-sm text-muted-foreground">30 minutes. We confirm everything above and you decide if it&apos;s a fit.</p><Button nativeButton={false} className="w-full bg-amber-500 text-black hover:bg-amber-400" render={<a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${startMsg}`} target="_blank" rel="noopener noreferrer" />}>Start with this plan →</Button></CardContent></Card><Card><CardContent className="p-6 space-y-3"><MessageCircle className="size-7 text-muted-foreground" /><p className="font-semibold text-foreground">I have questions first</p><p className="text-sm text-muted-foreground">Chat with us on WhatsApp. No pressure, no sales pitch.</p><Button variant="outline" nativeButton={false} className="w-full" render={<a href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${questionMsg}`} target="_blank" rel="noopener noreferrer" />}>Message us on WhatsApp</Button></CardContent></Card><Card className="border-dashed"><CardContent className="p-6 space-y-3"><RefreshCw className="size-7 text-muted-foreground" /><p className="font-semibold text-foreground">Start over</p><p className="text-sm text-muted-foreground">Try a different angle?</p><Button variant="ghost" nativeButton={false} className="w-full" render={<Link href="/get-started" />}>New consultation</Button></CardContent></Card></div></section>

      <section><h2 className="text-2xl font-bold text-center mb-8 text-foreground">What happens next</h2><div className="relative flex flex-col md:flex-row md:justify-between gap-8 md:gap-4 max-w-4xl mx-auto"><div className="hidden md:block absolute top-5 left-[12%] right-[12%] h-0.5 bg-amber-300 dark:bg-amber-800 z-0" aria-hidden />{[{title: 'Discovery call', body: '30-minute call to confirm your plan and answer questions'},{title: 'We build your system', body: 'Custom workflows built and tested. Usually 1-2 weeks.'},{title: 'You go live', body: 'Start saving time from day one. We stay on for ongoing support.'},].map((step, idx) => (<div key={step.title} className="flex md:flex-col items-start md:items-center gap-4 md:text-center flex-1 z-10"><div className="flex flex-col md:items-center gap-2 w-full md:w-auto"><div className="size-10 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center shrink-0 border-4 border-background">{idx + 1}</div>{idx < 2 ? (<div className="md:hidden w-px flex-1 min-h-[24px] ms-5 -mt-1 border-s-2 border-dashed border-amber-300 dark:border-amber-700" />) : null}</div><div className="min-w-0 pb-2 md:pb-0"><p className="font-semibold text-foreground">{step.title}</p><p className="text-sm text-muted-foreground mt-1">{step.body}</p></div></div>))}</div></section>
      <section className="max-w-2xl mx-auto text-center"><p className="text-sm italic text-muted-foreground">These numbers are estimates based on what you shared and benchmarks from similar businesses. Your discovery call confirms exact numbers and timeline before you pay anything.</p></section>
    </main>
  );
}

