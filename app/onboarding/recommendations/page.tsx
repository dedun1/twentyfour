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
  Target,
  User,
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { COOKIE_NAME } from '@/lib/onboarding-session';
import { PipelineAutoRefresh } from './PipelineAutoRefresh';
import { BookCallTrigger } from './BookCallTrigger';
import { Badge } from '@/components/ui/badge';
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
  custom_build?: boolean;
  data_quality?: 'high' | 'medium' | 'low';
  needs_clarification?: boolean;
};

type SessionRow = {
  id: string;
  user_id: string | null;
  captured_business_name: string | null;
  status: string;
  language?: 'en' | 'ar';
  business_summary?: string | null;
  monthly_revenue_at_risk?: number | null;
  recommendations?: RawRecommendation[] | null;
  pipeline_status?: 'pending' | 'running' | 'complete' | 'error' | null;
  pipeline_error?: string | null;
  pitcher_output?: {
    hero_headline?: string;
    hero_subline?: string;
    cost_of_inaction_headline?: string;
    transformation_promise?: string;
    cta_main?: string;
    cta_secondary?: string;
    closing_emotional_line?: string;
  } | null;
  strategist_output?: {
    core_bottleneck?: string;
    root_causes?: string[];
    highest_leverage_move?: string;
    monthly_cost_of_inaction?: number;
    risks_if_no_action?: string[];
    what_winning_looks_like?: string;
  } | null;
  captured_email?: string | null;
  captured_phone?: string | null;
};

function priorityClass(p: string) {
  if (p === 'high') return 'bg-red-500/15 text-red-500';
  if (p === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
}

function extractDollarsFromROI(roi: string): number {
  if (!roi) return 0;
  const match = roi.match(/[\$~]?\s*([\d,]+)\s*(?:USD|\$)?/i);
  if (!match) return 0;
  return Number.parseInt(match[1].replace(/,/g, ''), 10) || 0;
}

export default async function OnboardingRecommendationsPage({
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
  const cookieRaw = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const cookieIds: string[] = (() => {
    if (!cookieRaw) return [];
    const trimmed = cookieRaw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v.length > 0);
        }
      } catch { /* fall through */ }
    }
    return [trimmed];
  })();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  const { data, error } = await admin
    .from('onboarding_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) redirect('/get-started');
  const session = data as SessionRow;

  const isLocked = !user && !cookieIds.includes(sessionId);

  if (user && session.user_id && session.user_id !== user.id) {
    const { data: roleRow } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (roleRow?.role !== 'admin') redirect('/get-started');
  }

  if (!user && session.user_id) redirect('/get-started');

  if (session.status !== 'completed') redirect('/get-started');

  const pipelineStatus = session.pipeline_status ?? (session.recommendations?.length ? 'complete' : 'pending');
  if (pipelineStatus === 'pending' || pipelineStatus === 'running') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="mx-auto size-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <h1 className="text-2xl font-bold text-foreground">Building your custom plan...</h1>
        <PipelineAutoRefresh enabled />
      </main>
    );
  }

  if (pipelineStatus === 'error') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong building your plan.</h1>
        <p className="text-muted-foreground">
          Our team has been notified. Please try again shortly.
        </p>
      </main>
    );
  }

  if (isLocked) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">This plan is saved on its original browser</h1>
        <p className="text-muted-foreground">
          For privacy, anonymous consultations stay on the device they were created on. To access your plan from any device, create a free account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-block rounded-xl bg-amber-500 text-black px-5 py-3 font-semibold hover:bg-amber-400">
            Create free account →
          </Link>
          <Link href="/get-started" className="inline-block rounded-xl border border-border px-5 py-3 font-semibold hover:bg-muted">
            Start a new consultation
          </Link>
        </div>
      </main>
    );
  }

  const businessName = session.captured_business_name?.trim() || 'your business';
  const pitcher = session.pitcher_output ?? null;
  const strategist = session.strategist_output ?? null;
  const heroHeadline = pitcher?.hero_headline || 'Your Custom Automation Plan';
  const heroSubline = (pitcher?.hero_subline || `Here's what we'd build for ${businessName}`)
    .replaceAll('bottlenecks', 'challenges')
    .replaceAll('bottleneck', 'biggest challenge');
  const costHeadline = pitcher?.cost_of_inaction_headline || 'What manual work is costing you right now';
  const transformPromise = pitcher?.transformation_promise || 'What changes with TwentyFour';
  const ctaMain = pitcher?.cta_main || 'Book my discovery call';
  const ctaSecondary = pitcher?.cta_secondary || 'I have questions first';
  const closingLine = pitcher?.closing_emotional_line || '';
  const biggestChallenge = strategist?.core_bottleneck || null;
  const rootCauses = strategist?.root_causes || [];
  const risks = strategist?.risks_if_no_action || [];
  const winning = strategist?.what_winning_looks_like || null;
  const leverageMove = strategist?.highest_leverage_move || null;
  const hasStrategicInsight = Boolean(
    strategist &&
    (
      (biggestChallenge && biggestChallenge.trim()) ||
      (rootCauses && rootCauses.length > 0) ||
      (risks && risks.length > 0) ||
      (leverageMove && leverageMove.trim())
    )
  );
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
    const channel = rec.channel || 'SMS';
    const dataQuality = rec.data_quality === 'high' || rec.data_quality === 'medium' || rec.data_quality === 'low'
      ? rec.data_quality
      : 'low';
    const needsClarification = Boolean(rec.needs_clarification);

    const rawTitle = (rec.title || '').trim();
    const isGenericTitle = /^recommendation\s+\d+$/i.test(rawTitle);
    const fallbackTitle = (problem || `Recommendation ${i + 1}`).trim();
    return {
      title: isGenericTitle ? fallbackTitle : (rawTitle || fallbackTitle),
      problem,
      solution,
      currentPain,
      afterState,
      estimated_roi: roi,
      metric: {
        metric_name: metric.metric_name || 'Time spent',
        before: metric.before || 'Manual',
        after: metric.after || 'Automated',
        unit: metric.unit || '',
      },
      hours: Number.isFinite(hours) && hours > 0 ? Math.round(hours) : 4,
      priority,
      channel,
      custom_build: Boolean(rec.custom_build),
      data_quality: dataQuality,
      needs_clarification: needsClarification,
    };
  });

  const totalHoursSaved = recommendations.reduce((sum, rec) => sum + (rec.hours || 0), 0);
  const totalMonthlySavings = recommendations.reduce((sum, rec) => {
    return sum + extractDollarsFromROI(rec.estimated_roi || '');
  }, 0);
  const strategistCost = Number(strategist?.monthly_cost_of_inaction ?? 0);
  const atRisk = Number((session.monthly_revenue_at_risk ?? strategistCost) || (totalHoursSaved * 15));
  const monthlySavings = Math.max(totalMonthlySavings, 0);
  const costOfDoingNothing = monthlySavings + atRisk;
  const yearlySavings = monthlySavings * 12;
  const maxYearValue = Math.max(monthlySavings * 12, 1);
  const showSavings = Number.isFinite(monthlySavings) && monthlySavings > 0;
  const showCompoundingChart = yearlySavings > 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <section className="text-center py-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground max-w-3xl mx-auto">{heroHeadline}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{heroSubline}</p>
      </section>

      {showSavings ? (
        <section className="sticky top-0 z-40 -mt-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/95 backdrop-blur px-4 py-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-amber-800">
              ${monthlySavings}/month potential savings
            </p>
            <BookCallTrigger
              sessionId={session.id}
              prefilledEmail={session.captured_email ?? ''}
              prefilledName=""
              prefilledPhone={session.captured_phone ?? ''}
              prefilledBusiness={session.captured_business_name ?? ''}
              className="text-sm shrink-0 h-8 px-3"
              label="Book my call →"
            />
          </div>
        </section>
      ) : null}

      <section className="max-w-4xl mx-auto">
        <Card className="border-border bg-muted/30 border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">Here&apos;s what we heard from you</p>
            <blockquote className="text-base italic text-foreground leading-relaxed">
              “{session.business_summary || 'Business summary will be confirmed on discovery call.'}”
            </blockquote>
          </CardContent>
        </Card>
      </section>

      {hasStrategicInsight && biggestChallenge ? (
        <section className="rounded-2xl p-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-500 font-semibold">The real issue</p>
          <h2 className="text-3xl font-bold">{biggestChallenge}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="font-semibold">What&apos;s causing it</p>
              <div className="space-y-2">
                {rootCauses.map((item, idx) => (
                  <p key={idx} className="text-sm flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="font-semibold">If nothing changes</p>
              <div className="space-y-2">
                {risks.map((item, idx) => (
                  <p key={idx} className="text-sm flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>{item}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 rounded-2xl p-8 space-y-5">
        <div className="flex justify-center">
          <span className="size-3 rounded-full bg-red-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center">{costHeadline}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-red-200 dark:border-red-900 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {totalHoursSaved > 0 ? `${totalHoursSaved} hours/month` : 'We need a few more details to calculate this. We will cover it on the discovery call.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">lost to manual work</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalHoursSaved > 0 ? 'Calculated from: captured team workload and manual-task estimates' : 'Estimate to be confirmed on discovery call'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {atRisk > 0 ? `$${atRisk}` : 'We need a few more details to calculate this. We will cover it on the discovery call.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">in monthly revenue at risk</p>
              <p className="text-xs text-muted-foreground mt-1">
                {atRisk > 0 ? 'Calculated from: captured response delays, no-show context, and stated volume' : 'Estimate to be confirmed on discovery call'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {costOfDoingNothing > 0 ? `$${costOfDoingNothing}` : 'We need a few more details to calculate this. We will cover it on the discovery call.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">total monthly cost of doing nothing</p>
              <p className="text-xs text-muted-foreground mt-1">
                {costOfDoingNothing > 0 ? 'Calculated from: monthly value + revenue-at-risk estimate' : 'Estimate to be confirmed on discovery call'}
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Time savings calculated from your stated volume × industry benchmarks for each automation type.
        </p>
      </section>

      <section className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900 rounded-2xl p-8 space-y-5">
        <div className="flex justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5" />
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center">{transformPromise}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-emerald-200 dark:border-emerald-900 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {totalHoursSaved > 0 ? `${totalHoursSaved} hours/month` : 'We need a few more details to calculate this. We will cover it on the discovery call.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">back in your team&apos;s hands</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalHoursSaved > 0 ? 'Calculated from: recommendation-level hour recoveries' : 'Estimate to be confirmed on discovery call'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {monthlySavings > 0 ? `$${monthlySavings}` : 'We need a few more details to calculate this. We will cover it on the discovery call.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">potential monthly savings</p>
              <p className="text-xs text-muted-foreground mt-1">
                {monthlySavings > 0 ? 'Calculated from: recommendation ROI fields grounded in captured facts' : 'Estimate to be confirmed on discovery call'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900 bg-white dark:bg-card shadow-sm">
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {yearlySavings > 0 ? `$${yearlySavings}` : 'We need a few more details to calculate this. We will cover it on the discovery call.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">annual savings, year one</p>
              <p className="text-xs text-muted-foreground mt-1">
                {yearlySavings > 0 ? 'Calculated from: monthly estimate multiplied by 12' : 'Estimate to be confirmed on discovery call'}
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Estimates based on your specific volume and benchmarks from similar businesses. Your discovery call confirms exact numbers.
        </p>
      </section>

      {hasStrategicInsight && leverageMove ? (
        <section>
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 rounded-2xl">
            <CardContent className="p-8 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-semibold">Where to start</p>
              <h2 className="text-3xl font-bold text-foreground">{leverageMove}</h2>
              <p className="text-sm italic text-muted-foreground">We recommend starting here for the biggest immediate impact</p>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-foreground">How we&apos;ll transform your operations</h2>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.title} className="rounded-xl border-border bg-gradient-to-br from-card to-card/80 hover:shadow-lg hover:scale-[1.01] transition-all">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-foreground">{rec.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="rounded-full border border-border/60">{rec.channel}</Badge>
                    {rec.custom_build ? <Badge variant="outline" className="rounded-full border border-border/60">Custom Build</Badge> : null}
                    <Badge className={`${priorityClass(rec.priority)} rounded-full border border-transparent`}>{rec.priority}</Badge>
                    <Badge
                      className={
                        rec.data_quality === 'high'
                          ? 'rounded-full bg-emerald-500/15 text-emerald-600'
                          : rec.data_quality === 'medium'
                            ? 'rounded-full bg-amber-500/15 text-amber-600'
                            : 'rounded-full bg-muted text-muted-foreground'
                      }
                    >
                      {rec.data_quality === 'high'
                        ? 'Specific to your data'
                        : rec.data_quality === 'medium'
                          ? 'Based on your pain points'
                          : 'To be detailed on discovery call'}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                  <div className="bg-red-50/50 dark:bg-red-950/10 rounded-xl p-4 border border-red-200/60 dark:border-red-900/60 space-y-3">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
                      <XCircle className="size-4" />
                      TODAY
                    </div>
                    <p className="text-sm text-foreground">{rec.problem || 'Identified from your consultation'}</p>
                    <p className="text-xs italic text-muted-foreground">{rec.currentPain}</p>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Currently: {rec.metric.metric_name} = {rec.metric.before}
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center justify-center gap-2">
                    <ChevronRight className="size-8 text-amber-500 hidden md:block animate-pulse" />
                    <ChevronRight className="size-8 text-amber-500 rotate-90 md:hidden animate-pulse" />
                    {!rec.needs_clarification && rec.data_quality !== 'low' ? (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-1">
                        +{rec.hours} hrs/mo
                      </span>
                    ) : null}
                  </div>

                  <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-4 border border-emerald-200/60 dark:border-emerald-900/60 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      <CheckCircle2 className="size-4" />
                      WITH TWENTYFOUR
                    </div>
                    <p className="text-sm text-foreground">{rec.solution || 'Custom workflow - details confirmed on discovery call'}</p>
                    <p className="text-xs italic text-muted-foreground">{rec.afterState}</p>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      After: {rec.metric.metric_name} = {rec.metric.after}
                    </p>
                  </div>
                </div>

                <details className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">View details</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    This estimate is based on your channel mix ({rec.channel}), current process pain, and projected reduction in repetitive handling.
                  </p>
                </details>

                <div className="flex justify-end">
                  {!rec.needs_clarification && rec.data_quality !== 'low' ? (
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">{rec.estimated_roi}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Specific impact confirmed on discovery call.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-foreground">How confident are we in these numbers?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 space-y-2">
              <User className="size-5 text-amber-500" />
              <p className="font-semibold text-foreground">Based on your data</p>
              <p className="text-sm text-muted-foreground">We used the volume, channels, and pain points you shared. Not generic stats.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <Target className="size-5 text-amber-500" />
              <p className="font-semibold text-foreground">Calibrated to your business</p>
              <p className="text-sm text-muted-foreground">Each estimate is tailored to your industry, region, and operational style.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 space-y-2">
              <Shield className="size-5 text-amber-500" />
              <p className="font-semibold text-foreground">Conservative by default</p>
              <p className="text-sm text-muted-foreground">Our estimates assume realistic implementation. Most clients see better results.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {hasStrategicInsight && winning ? (
        <section className="py-16 rounded-2xl bg-gradient-to-b from-amber-50/50 to-emerald-50/50 dark:from-amber-950/20 dark:to-emerald-950/20 text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">What your business looks like in 6 months</h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed text-foreground">{winning}</p>
        </section>
      ) : null}

      {showCompoundingChart ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-center text-foreground">Your savings compound every month</h2>
          <div className="rounded-2xl border border-border p-4 overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="text-right mb-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                Year 1 total: ${monthlySavings * 12}
              </div>
              <div className="flex items-end gap-2 h-[280px]">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthIndex = i + 1;
                  const monthValue = monthlySavings * monthIndex;
                  const heightPx = Math.max(12, Math.round((monthValue / maxYearValue) * 240));
                  const milestoneLabel =
                    monthIndex === 1 ? 'Setup begins'
                      : monthIndex === 2 ? 'First savings'
                        : monthIndex === 3 ? 'Setup pays for itself'
                          : monthIndex === 6 ? `$${monthlySavings * 6} saved`
                            : monthIndex === 12 ? `Year 1 total: $${monthlySavings * 12}`
                              : '.';
                  return (
                    <div key={monthIndex} className="flex-1 min-w-[48px] flex flex-col items-center justify-end gap-2">
                      <span className={`text-[10px] text-center ${milestoneLabel === '.' ? 'text-transparent select-none' : 'text-amber-700 dark:text-amber-300'}`}>
                        {milestoneLabel}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-amber-400 to-amber-300 shadow-[0_8px_20px_rgba(251,191,36,0.35)]"
                        style={{ height: `${heightPx}px` }}
                        title={`Month ${monthIndex}: $${monthValue} potential cumulative savings`}
                      />
                      <span className="text-xs text-muted-foreground">M{monthIndex}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <TrendingUp className="size-6 text-amber-500" />
            <p className="font-semibold text-foreground">Conservative estimates</p>
            <p className="text-sm text-muted-foreground">Numbers above use industry benchmarks. Most clients see better results.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <Clock className="size-6 text-amber-500" />
            <p className="font-semibold text-foreground">Live in 2 weeks</p>
            <p className="text-sm text-muted-foreground">Full setup, training, and handoff. You start saving immediately.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <Shield className="size-6 text-amber-500" />
            <p className="font-semibold text-foreground">We deliver or refund</p>
            <p className="text-sm text-muted-foreground">If we don&apos;t build what&apos;s promised in your discovery call, you pay nothing.</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card className="rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-12 text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              {showSavings ? `Ready to stop losing $${monthlySavings}/month?` : 'Ready to stop losing money every month?'}
            </h2>
            <p className="max-w-3xl mx-auto text-white/90">
              30-minute discovery call. We confirm the plan, lock in your timeline, and answer every question. No payment until you&apos;re 100% sure.
            </p>
            <BookCallTrigger
              sessionId={session.id}
              prefilledEmail={session.captured_email ?? ''}
              prefilledName=""
              prefilledPhone={session.captured_phone ?? ''}
              prefilledBusiness={session.captured_business_name ?? ''}
              variant="on-amber"
              label="Book my discovery call →"
            />
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground">
          Want to start over? <Link href="/get-started" className="underline">Try a different angle →</Link>
        </p>
      </section>

      <section className="text-center space-y-8">
        {closingLine ? <p className="text-2xl italic text-foreground">{closingLine}</p> : null}
        <h2 className="text-2xl font-bold text-center mb-8 text-foreground">What happens next</h2>
        <div className="relative flex flex-col md:flex-row md:justify-between gap-8 md:gap-4 max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-5 left-[12%] right-[12%] h-0.5 bg-amber-300 dark:bg-amber-800 z-0" aria-hidden />
          {[
            {
              title: 'Discovery call',
              body: '30-minute call to confirm your plan and answer questions',
            },
            {
              title: 'We build your system',
              body: 'Custom workflows built and tested. Usually 1-2 weeks.',
            },
            {
              title: 'You go live',
              body: 'Start saving time from day one. We stay on for ongoing support.',
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

      <section className="max-w-2xl mx-auto text-center space-y-3">
        <p className="text-sm italic text-muted-foreground">
          These numbers are estimates based on what you shared and benchmarks from similar businesses. Your discovery call confirms exact numbers and timeline before you pay anything.
        </p>
        {session.captured_email ? (
          <p className="text-sm text-muted-foreground">
            {"We've also sent this plan to "}
            <span className="font-semibold text-foreground">{session.captured_email}</span>
            {" so you have it forever."}
          </p>
        ) : null}
      </section>
    </main>
  );
}

