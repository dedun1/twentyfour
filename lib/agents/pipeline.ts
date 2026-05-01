import { createAdminClient } from '@/lib/supabase/admin';
import { runPitcher } from './pitcher';
import { runPricer } from './pricer';
import { runRecommender } from './recommender';
import { runStrategist } from './strategist';
import type {
  ConsultantOutput,
  PipelineResult,
  PitcherOutput,
  PricerOutput,
  RecommenderOutput,
  StrategistOutput,
} from './types';

export async function runPipeline(sessionId: string, consultantOutput: ConsultantOutput): Promise<PipelineResult> {
  console.log('[Pipeline] Starting for session:', sessionId);
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin
    .from('onboarding_sessions')
    .update({ pipeline_status: 'running', pipeline_error: null })
    .eq('id', sessionId);

  const { data: sessionRow } = await supabaseAdmin
    .from('onboarding_sessions')
    .select('captured_business_name, contact_name, detected_industry, business_summary, monthly_revenue_at_risk, monthly_team_cost, monthly_tool_spend, monthly_ad_spend, transcript, captured_facts')
    .eq('id', sessionId)
    .maybeSingle();

  const rowFacts = (sessionRow?.captured_facts && typeof sessionRow.captured_facts === 'object')
    ? (sessionRow.captured_facts as Record<string, unknown>)
    : {};
  const facts = consultantOutput.captured_facts || {
    monthly_revenue: typeof rowFacts.monthly_revenue === 'number' ? rowFacts.monthly_revenue : null,
    daily_orders: typeof rowFacts.daily_orders === 'number' ? rowFacts.daily_orders : null,
    average_order_value: typeof rowFacts.average_order_value === 'number' ? rowFacts.average_order_value : null,
    team_size: typeof rowFacts.team_size === 'number' ? rowFacts.team_size : null,
    cost_per_acquisition: typeof rowFacts.cost_per_acquisition === 'number' ? rowFacts.cost_per_acquisition : null,
    monthly_team_cost: typeof rowFacts.monthly_team_cost === 'number' ? rowFacts.monthly_team_cost : null,
    monthly_tool_spend: typeof rowFacts.monthly_tool_spend === 'number' ? rowFacts.monthly_tool_spend : null,
    monthly_ad_spend: typeof rowFacts.monthly_ad_spend === 'number' ? rowFacts.monthly_ad_spend : null,
    hours_lost_per_week: typeof rowFacts.hours_lost_per_week === 'number' ? rowFacts.hours_lost_per_week : null,
    response_time: typeof rowFacts.response_time === 'string' ? rowFacts.response_time : null,
    no_show_rate: typeof rowFacts.no_show_rate === 'string' ? rowFacts.no_show_rate : null,
    pain_points: Array.isArray(rowFacts.pain_points) ? rowFacts.pain_points.filter((x): x is string => typeof x === 'string') : [],
    manual_processes: Array.isArray(rowFacts.manual_processes) ? rowFacts.manual_processes.filter((x): x is string => typeof x === 'string') : [],
    current_tools: Array.isArray(rowFacts.current_tools) ? rowFacts.current_tools.filter((x): x is string => typeof x === 'string') : [],
    product_or_service: typeof rowFacts.product_or_service === 'string' ? rowFacts.product_or_service : null,
    customer_type: typeof rowFacts.customer_type === 'string' ? rowFacts.customer_type : null,
    acquisition_channel: typeof rowFacts.acquisition_channel === 'string' ? rowFacts.acquisition_channel : null,
    retention_strategy: typeof rowFacts.retention_strategy === 'string' ? rowFacts.retention_strategy : null,
  };
  const businessData = {
    business_name: sessionRow?.captured_business_name || facts.product_or_service || consultantOutput.contact.business_name || 'Unknown',
    contact_name: sessionRow?.contact_name || consultantOutput.contact.name || '',
    industry: sessionRow?.detected_industry || 'unknown',
    country: 'usa' as const,
    business_summary: sessionRow?.business_summary || consultantOutput.business_summary || '',
    transcript: (sessionRow?.transcript as Array<{ role: 'user' | 'assistant'; content: string }> | null) || consultantOutput.transcript,
    captured_facts: {
      monthly_revenue: facts.monthly_revenue ?? sessionRow?.monthly_revenue_at_risk ?? null,
      daily_orders: facts.daily_orders ?? null,
      average_order_value: facts.average_order_value ?? null,
      team_size: facts.team_size ?? null,
      monthly_ad_spend: facts.monthly_ad_spend ?? sessionRow?.monthly_ad_spend ?? null,
      cost_per_acquisition: facts.cost_per_acquisition ?? null,
      monthly_team_cost: facts.monthly_team_cost ?? sessionRow?.monthly_team_cost ?? null,
      monthly_tool_spend: facts.monthly_tool_spend ?? sessionRow?.monthly_tool_spend ?? null,
      hours_lost_per_week: facts.hours_lost_per_week ?? null,
      response_time: facts.response_time ?? null,
      no_show_rate: facts.no_show_rate ?? null,
      pain_points: facts.pain_points ?? [],
      manual_processes: facts.manual_processes ?? [],
      current_tools: facts.current_tools ?? [],
      product_or_service: facts.product_or_service ?? null,
      customer_type: facts.customer_type ?? null,
      acquisition_channel: facts.acquisition_channel ?? null,
      retention_strategy: facts.retention_strategy ?? null,
    },
  };

  const fallbackStrategist: StrategistOutput = {
    core_bottleneck: 'Unable to determine bottleneck from available data.',
    root_causes: ['Missing structured strategist output'],
    highest_leverage_move: 'Confirm key operational bottlenecks on discovery call.',
    monthly_cost_of_inaction: 1,
    risks_if_no_action: ['Operational inefficiency may continue'],
    growth_blockers: ['Insufficient strategic data'],
    what_winning_looks_like: 'A clearer operating model with fewer manual bottlenecks.',
    strategic_summary: 'Strategic analysis fallback due to processing failure.',
  };
  const fallbackRecommender: RecommenderOutput = {
    recommendations: [],
    total_hours_saved: 1,
    total_monthly_value: 10,
  };
  const fallbackPricer: PricerOutput = {
    total_build_complexity: 'medium',
    estimated_build_hours: 24,
    suggested_quote_range_usd: { min: 1200, max: 2500 },
    recommended_tier: 'Pro $299/mo + setup $1200',
    budget_fit: 'unknown',
    pricing_strategy_note: 'Use discovery call to validate scope and align quote with expected ROI.',
  };
  const fallbackPitcher: PitcherOutput = {
    hero_headline: "Here's what to fix first",
    hero_subline: 'We prepared a practical plan from your consultation details.',
    cost_of_inaction_headline: 'Every month you wait, avoidable losses continue',
    transformation_promise: 'Fix the bottlenecks and run operations with less chaos.',
    cta_main: 'Book the call and get started',
    cta_secondary: 'I have questions first',
    closing_emotional_line: "Let's get your time and momentum back.",
  };

  const errors: string[] = [];
  let strategistOutput: StrategistOutput | null = null;
  let recommenderOutput: RecommenderOutput | null = null;
  let pricerOutput: PricerOutput | null = null;
  let pitcherOutput: PitcherOutput | null = null;

  console.log('[Pipeline] Step 1: Running strategist...');
  const strategistStart = Date.now();
  try {
    strategistOutput = await runStrategist(consultantOutput, businessData);
    console.log('[Pipeline] Step 1: strategist completed in', Date.now() - strategistStart, 'ms');
    console.log('[Pipeline] Step 1: strategist output keys:', Object.keys(strategistOutput));
    await supabaseAdmin.from('onboarding_sessions').update({ strategist_output: strategistOutput }).eq('id', sessionId);
    console.log('[Pipeline] Strategist saved');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`strategist:${message}`);
    console.error('[Pipeline] Step 1: strategist FAILED:', message);
    strategistOutput = fallbackStrategist;
    await supabaseAdmin.from('onboarding_sessions').update({ strategist_output: strategistOutput }).eq('id', sessionId);
    console.log('[Pipeline] Step 1: strategist fallback saved');
  }

  console.log('[Pipeline] Step 2: Running recommender...');
  const recommenderStart = Date.now();
  try {
    recommenderOutput = await runRecommender(consultantOutput, strategistOutput ?? fallbackStrategist, businessData);
    console.log('[Pipeline] Step 2: recommender completed in', Date.now() - recommenderStart, 'ms');
    console.log('[Pipeline] Step 2: recommender output keys:', Object.keys(recommenderOutput));
    await supabaseAdmin
      .from('onboarding_sessions')
      .update({ recommendations: recommenderOutput?.recommendations || [] })
      .eq('id', sessionId);
    console.log('[Pipeline] Recommender saved');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`recommender:${message}`);
    console.error('[Pipeline] Step 2: recommender FAILED:', message);
    recommenderOutput = fallbackRecommender;
    await supabaseAdmin
      .from('onboarding_sessions')
      .update({ recommendations: recommenderOutput.recommendations })
      .eq('id', sessionId);
    console.log('[Pipeline] Step 2: recommender fallback saved');
  }

  console.log('[Pipeline] Step 3: Running pricer...');
  const pricerStart = Date.now();
  try {
    pricerOutput = await runPricer(recommenderOutput ?? fallbackRecommender, consultantOutput, businessData);
    console.log('[Pipeline] Step 3: pricer completed in', Date.now() - pricerStart, 'ms');
    console.log('[Pipeline] Step 3: pricer output keys:', Object.keys(pricerOutput));
    await supabaseAdmin.from('onboarding_sessions').update({ pricer_output: pricerOutput }).eq('id', sessionId);
    console.log('[Pipeline] Pricer saved');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`pricer:${message}`);
    console.error('[Pipeline] Step 3: pricer FAILED:', message);
    pricerOutput = fallbackPricer;
    await supabaseAdmin.from('onboarding_sessions').update({ pricer_output: pricerOutput }).eq('id', sessionId);
    console.log('[Pipeline] Step 3: pricer fallback saved');
  }

  console.log('[Pipeline] Step 4: Running pitcher...');
  const pitcherStart = Date.now();
  try {
    pitcherOutput = await runPitcher(
      consultantOutput,
      strategistOutput ?? fallbackStrategist,
      recommenderOutput ?? fallbackRecommender,
      businessData
    );
    console.log('[Pipeline] Step 4: pitcher completed in', Date.now() - pitcherStart, 'ms');
    console.log('[Pipeline] Step 4: pitcher output keys:', Object.keys(pitcherOutput));
    await supabaseAdmin.from('onboarding_sessions').update({ pitcher_output: pitcherOutput }).eq('id', sessionId);
    console.log('[Pipeline] Pitcher saved');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`pitcher:${message}`);
    console.error('[Pipeline] Step 4: pitcher FAILED:', message);
    pitcherOutput = fallbackPitcher;
    await supabaseAdmin.from('onboarding_sessions').update({ pitcher_output: pitcherOutput }).eq('id', sessionId);
    console.log('[Pipeline] Step 4: pitcher fallback saved');
  }

  await supabaseAdmin
    .from('onboarding_sessions')
    .update({
      pipeline_status: 'complete',
      pipeline_error: errors.length ? errors.join(' | ') : null,
    })
    .eq('id', sessionId);

  return {
    consultant: consultantOutput,
    strategist: strategistOutput ?? fallbackStrategist,
    recommender: recommenderOutput ?? fallbackRecommender,
    pricer: pricerOutput ?? fallbackPricer,
    pitcher: pitcherOutput ?? fallbackPitcher,
  };
}
