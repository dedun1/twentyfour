import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import {
  addSessionIdToCookie,
  COOKIE_NAME,
  cookieHasSessionId,
  getOrCreateSessionId,
  getSessionIdsFromCookie,
} from '@/lib/onboarding-session';
import {
  type ClaudeCapture,
  CONSULTANT_SYSTEM_PROMPT,
  CONSULTANT_CONTACT_RULES_APPENDIX,
  getMissingContactFields,
  isRecord,
  coerceCapture as importedCoerceCapture,
  normalizeRecommendations as importedNormalizeRecommendations,
} from '@/lib/agents/consultant';
import { runPipeline } from '@/lib/agents/pipeline';
import type { CapturedFacts, ConsultantOutput } from '@/lib/agents/types';

function parseSessionIdsFromCookieValueLocal(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
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
}

type TranscriptRole = 'user' | 'assistant';
type TranscriptEntry = { role: TranscriptRole; content: string; created_at: string };

type Recommendation = {
  title: string;
  problem: string;
  solution: string;
  current_pain: string;
  after_state: string;
  time_saved_hours_per_month: number;
  estimated_roi: string;
  impact_metric: {
    metric_name: string;
    before: string;
    after: string;
    unit: string;
  };
  priority: 'high' | 'medium' | 'low';
  channel: string;
};

/** Single client-safe closing line for complete:true API responses. */
const COMPLETION_CLIENT_MESSAGE =
  "Thanks for sharing everything. Your personalized plan is being built right now. You'll see it in just a few seconds.";

type ClaudeInterviewResponse =
  | {
      complete: false;
      next_question: string;
      show_generate_button?: boolean;
      capture?: ClaudeCapture;
    }
  | {
      complete: true;
      next_question: string;
      business_summary: string;
      monthly_revenue_at_risk: number;
      captured_budget_range?: 'under_300' | '300_to_1000' | '1000_plus' | 'not_sure';
      captured_facts?: CapturedFacts;
      recommendations: Recommendation[];
      capture?: ClaudeCapture;
    };

function prepareTextForJsonParse(rawText: string): string {
  let textToParse = rawText.trim();
  if (textToParse.startsWith('```json')) textToParse = textToParse.slice(7);
  if (textToParse.startsWith('```')) textToParse = textToParse.slice(3);
  if (textToParse.endsWith('```')) textToParse = textToParse.slice(0, -3);
  textToParse = textToParse.trim();
  if (!textToParse.startsWith('{')) {
    const first = textToParse.indexOf('{');
    const last = textToParse.lastIndexOf('}');
    if (first !== -1 && last > first) {
      textToParse = textToParse.substring(first, last + 1);
    }
  }
  return textToParse.trim();
}

function detectLanguageFromText(message: string): 'en' | 'ar' {
  // If it contains Arabic characters, treat it as Arabic.
  const hasArabic = /[\u0600-\u06FF]/.test(message);
  return hasArabic ? 'ar' : 'en';
}

function isClaudeInterviewResponse(value: unknown): value is ClaudeInterviewResponse {
  if (!isRecord(value)) return false;
  if (typeof value.complete !== 'boolean') return false;

  if (value.complete === false) {
    if (typeof value.next_question !== 'string') return false;
    if (value.show_generate_button !== undefined && typeof value.show_generate_button !== 'boolean') return false;
    return value.capture === undefined || isRecord(value.capture);
  }

  if (value.complete === true) {
    if (typeof value.next_question !== 'string') return false;
    if (typeof value.business_summary !== 'string') return false;
    if (typeof value.monthly_revenue_at_risk !== 'number') return false;
    if (!Array.isArray(value.recommendations)) return false;
    if (
      value.captured_budget_range !== undefined &&
      value.captured_budget_range !== 'under_300' &&
      value.captured_budget_range !== '300_to_1000' &&
      value.captured_budget_range !== '1000_plus' &&
      value.captured_budget_range !== 'not_sure'
    ) return false;
    return value.capture === undefined || isRecord(value.capture);
  }

  return false;
}

function normalizeCapturedFacts(input: unknown): CapturedFacts {
  const facts = isRecord(input) ? input : {};
  const asNumber = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const asStringList = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean) : [];
  return {
    monthly_revenue: asNumber(facts.monthly_revenue),
    daily_orders: asNumber(facts.daily_orders),
    average_order_value: asNumber(facts.average_order_value),
    team_size: asNumber(facts.team_size),
    cost_per_acquisition: asNumber(facts.cost_per_acquisition),
    monthly_team_cost: asNumber(facts.monthly_team_cost),
    monthly_tool_spend: asNumber(facts.monthly_tool_spend),
    monthly_ad_spend: asNumber(facts.monthly_ad_spend),
    hours_lost_per_week: asNumber(facts.hours_lost_per_week),
    response_time: asString(facts.response_time),
    no_show_rate: asString(facts.no_show_rate),
    pain_points: asStringList(facts.pain_points),
    manual_processes: asStringList(facts.manual_processes),
    current_tools: asStringList(facts.current_tools),
    product_or_service: asString(facts.product_or_service),
    customer_type: asString(facts.customer_type),
    acquisition_channel: asString(facts.acquisition_channel),
    retention_strategy: asString(facts.retention_strategy),
  };
}

async function extractCapturedFactsFromTranscript(
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<CapturedFacts | null> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const extractionResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Extract structured facts from this consultation transcript. Return ONLY valid JSON, no other text.

Transcript:
${JSON.stringify(transcript)}

Return this exact structure (use null for anything not explicitly stated):
{
  "monthly_revenue": <number or null>,
  "daily_orders": <number or null>,
  "average_order_value": <number or null>,
  "team_size": <number or null>,
  "monthly_ad_spend": <number or null>,
  "cost_per_acquisition": <number or null>,
  "monthly_team_cost": <number or null>,
  "monthly_tool_spend": <number or null>,
  "hours_lost_per_week": <number or null>,
  "response_time": <string or null>,
  "no_show_rate": <string or null>,
  "pain_points": ["array of specific pain points mentioned"],
  "manual_processes": ["array of manual tasks described"],
  "current_tools": ["array of tools mentioned like Shopify, Excel, Instagram"],
  "product_or_service": <string or null>,
  "customer_type": <string or null>,
  "acquisition_channel": <string or null>,
  "retention_strategy": <string or null>
}`,
      },
    ],
  });

  const extractedText = extractionResponse.content
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { type: string; text?: string }) => b.text || '')
    .join('\n');

  try {
    const parsed = JSON.parse(extractedText.replace(/```json|```/gi, '').trim());
    return normalizeCapturedFacts(parsed);
  } catch {
    return null;
  }
}

async function callClaude(messages: TranscriptEntry[], system: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const extractedText = response.content
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { type: string; text?: string }) => block.text || '')
    .join('\n')
    .trim();

  return extractedText;
}

function parseClaudeResponse(text: string): ClaudeInterviewResponse {
  const cleanedText = prepareTextForJsonParse(text);

  let parsed: unknown;

  if (cleanedText.startsWith('{')) {
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      console.log('[onboarding/chat] JSON parse failed, wrapping as next_question. Raw:', text);
      return {
        complete: false,
        next_question: cleanedText.trim() || 'Sorry, I had trouble responding. Could you say that again?',
        capture: undefined,
      };
    }
  } else {
    console.log('[onboarding/chat] Claude returned plain text, wrapping as next_question');
    return {
      complete: false,
      next_question: cleanedText || 'Sorry, I had trouble responding. Could you try again?',
      capture: undefined,
    };
  }

  if (!isClaudeInterviewResponse(parsed)) {
    if (isRecord(parsed) && typeof parsed.next_question === 'string') {
      return {
        complete: false,
        next_question: parsed.next_question,
        capture: parsed.capture ? importedCoerceCapture(parsed.capture) : undefined,
      };
    }
    return {
      complete: false,
      next_question: cleanedText,
      capture: undefined,
    };
  }

  if (parsed.complete === true) {
    const monthly_revenue_at_risk = typeof parsed.monthly_revenue_at_risk === 'number' && Number.isFinite(parsed.monthly_revenue_at_risk)
      ? Math.max(1, Math.round(parsed.monthly_revenue_at_risk))
      : 1;
    const captured_budget_range =
      parsed.captured_budget_range === 'under_300' ||
      parsed.captured_budget_range === '300_to_1000' ||
      parsed.captured_budget_range === '1000_plus' ||
      parsed.captured_budget_range === 'not_sure'
        ? parsed.captured_budget_range
        : undefined;
    return {
      complete: true,
      next_question: parsed.next_question,
      business_summary: parsed.business_summary,
      monthly_revenue_at_risk,
      captured_budget_range,
      recommendations: importedNormalizeRecommendations(parsed.recommendations),
      capture: parsed.capture ? importedCoerceCapture(parsed.capture) : undefined,
    };
  }

  return {
    complete: false,
    next_question: parsed.next_question,
    capture: parsed.capture ? importedCoerceCapture(parsed.capture) : undefined,
  };
}

function extractJSON(text: string): any {
  let cleaned = prepareTextForJsonParse(text);

  if (cleaned.startsWith('{')) {
    try {
      return JSON.parse(cleaned);
    } catch {
      // continue
    }
  }

  const jsonPatterns = [
    cleaned.indexOf('{"complete"'),
    cleaned.indexOf('{"next_question"'),
    cleaned.indexOf('{\\"complete\\"'),
    cleaned.indexOf('{\\"next_question\\"'),
  ].filter((i) => i >= 0);

  if (jsonPatterns.length > 0) {
    const startIndex = Math.min(...jsonPatterns);
    const jsonCandidate = cleaned.substring(startIndex);
    try {
      return JSON.parse(jsonCandidate);
    } catch {
      // continue
    }

    let braceCount = 0;
    let endIndex = -1;
    for (let i = 0; i < jsonCandidate.length; i++) {
      if (jsonCandidate[i] === '{') braceCount++;
      if (jsonCandidate[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
    if (endIndex > 0) {
      try {
        return JSON.parse(jsonCandidate.substring(0, endIndex));
      } catch {
        // continue
      }
    }
  }

  console.log('[extractJSON] All parsing failed. Wrapping as plain text.');
  return {
    complete: false,
    next_question: cleaned,
    capture: {},
  };
}

type SessionRowForLayer2 = {
  id: string;
  captured_email: string | null;
  captured_phone: string | null;
  captured_business_name: string | null;
  captured_budget_range: string | null;
  business_summary: string | null;
  monthly_revenue_at_risk: number | null;
};

type ContactGuardRow = {
  id: string;
  captured_email: string | null | undefined;
  captured_phone: string | null | undefined;
};

/** If email/phone are missing or invalid, persist a guard assistant turn and return a JSON response. Otherwise null. */
async function respondIfContactGuardFails(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  sessionRow: ContactGuardRow,
  transcriptAppendBase: TranscriptEntry[],
): Promise<NextResponse | null> {
  const finalEmail = String(sessionRow.captured_email || '').trim();
  const finalPhone = String(sessionRow.captured_phone || '').trim();
  const isInvalidEmail =
    !finalEmail || finalEmail === 'not_provided' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail);
  const isInvalidPhone =
    !finalPhone || finalPhone === 'not_provided' || finalPhone.replace(/\D/g, '').length < 7;

  if (!isInvalidEmail && !isInvalidPhone) return null;

  const missing: string[] = [];
  if (isInvalidEmail) missing.push('email');
  if (isInvalidPhone) missing.push('phone number');
  const ask =
    missing.length === 2
      ? "Before I build your plan, I need your email and best phone number. We send the full plan to your email so you have it forever, and we'll text you to confirm your discovery call. What's the best email and phone?"
      : isInvalidEmail
        ? "Before I build your plan, I need your email so we can send you the full plan. What's the best email?"
        : "Before I build your plan, I need your best phone number so we can text you to confirm your discovery call. What's the best number?";
  const guardAssistantMessage: TranscriptEntry = {
    role: 'assistant',
    content: ask,
    created_at: new Date().toISOString(),
  };
  await supabaseAdmin
    .from('onboarding_sessions')
    .update({
      transcript: [...transcriptAppendBase, guardAssistantMessage],
    })
    .eq('id', sessionRow.id);
  return NextResponse.json({
    complete: false,
    next_question: ask,
    show_generate_button: false,
    session_id: sessionRow.id,
  });
}

/**
 * LAYER 2: Raw model text indicates complete:true but JSON was not parsed as a complete object.
 * Persists session using Haiku captured_facts fallback + triggers pipeline.
 */
async function tryFinalizeWhenRawCompleteTrueUnparsed(
  extractedText: string,
  parsed: Record<string, unknown>,
  transcriptAfterUser: TranscriptEntry[],
  sessionRow: SessionRowForLayer2,
  supabaseAdmin: ReturnType<typeof createAdminClient>
): Promise<NextResponse | null> {
  if (parsed.complete === true) return null;
  if (!/"complete"\s*:\s*true/.test(extractedText)) return null;

  console.log('[COMPLETION] Force-detected complete:true from unparseable response');

  const guardLayer2 = await respondIfContactGuardFails(supabaseAdmin, sessionRow, transcriptAfterUser);
  if (guardLayer2) return guardLayer2;

  const email = String(sessionRow.captured_email || '').trim();
  const phone = String(sessionRow.captured_phone || '').trim();

  const assistantMessage: TranscriptEntry = {
    role: 'assistant',
    content: COMPLETION_CLIENT_MESSAGE,
    created_at: new Date().toISOString(),
  };
  const completeTranscript = [...transcriptAfterUser, assistantMessage] as TranscriptEntry[];

  const capturedFacts = await extractCapturedFactsFromTranscript(
    completeTranscript.map((entry) => ({ role: entry.role, content: entry.content }))
  );

  const budgetRaw = sessionRow.captured_budget_range;
  const budget_range: ConsultantOutput['raw_data']['budget_range'] =
    budgetRaw === 'under_300' || budgetRaw === '300_to_1000' || budgetRaw === '1000_plus' || budgetRaw === 'not_sure'
      ? budgetRaw
      : 'not_sure';

  const consultantOutput: ConsultantOutput = {
    business_summary: String(sessionRow.business_summary || ''),
    contact: {
      name: String(sessionRow.captured_business_name || ''),
      email,
      phone,
      business_name: String(sessionRow.captured_business_name || ''),
    },
    raw_data: { budget_range },
    captured_facts: capturedFacts ?? undefined,
    transcript: completeTranscript.map((entry) => ({ role: entry.role, content: entry.content })),
  };

  const { error: updateError } = await supabaseAdmin
    .from('onboarding_sessions')
    .update({
      business_summary: consultantOutput.business_summary,
      captured_email: email,
      captured_phone: phone,
      captured_business_name: sessionRow.captured_business_name,
      captured_budget_range: budget_range,
      monthly_revenue_at_risk: Math.max(1, Math.round(Number(sessionRow.monthly_revenue_at_risk ?? 1))),
      captured_facts: capturedFacts ?? null,
      status: 'completed',
      pipeline_status: 'running',
      recommendations: [] as Recommendation[],
      transcript: completeTranscript,
      completed_at: new Date().toISOString(),
      conversation_stage: 'close',
      country: 'usa',
    })
    .eq('id', sessionRow.id);

  if (updateError) {
    console.error('[COMPLETION] Layer2 DB error:', updateError);
  }

  runPipeline(sessionRow.id, consultantOutput).catch((err) => {
    console.error('[COMPLETION] Layer2 pipeline failed:', (err as Error)?.message || err);
  });

  return NextResponse.json({
    complete: true,
    next_question: COMPLETION_CLIENT_MESSAGE,
    session_id: sessionRow.id,
  });
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  // Fallback - Next doesn't always provide a request.ip in edge runtimes.
  return 'unknown-ip';
}

export async function POST(request: Request) {
  try {
    console.log('[onboarding/chat] Request received at', new Date().toISOString());
    console.log('[onboarding/chat] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('[onboarding/chat] ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length || 0);
    console.log('[onboarding/chat] Supabase URL present:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[onboarding/chat] Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const fail500 = (label: string, error: unknown) => {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('[onboarding/chat] HANDLED 500');
      console.error('Label:', label);
      console.error('Type:', (error as { constructor?: { name?: string } } | null)?.constructor?.name);
      console.error('Message:', error instanceof Error ? error.message : String(error));
      console.error('Stack:', error instanceof Error ? error.stack : 'no stack');
      console.error('Full JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return NextResponse.json({
        error: 'Failed to start consultation',
        debug: process.env.NODE_ENV === 'development' ? {
          label,
          message: error instanceof Error ? error.message : String(error),
          type: (error as { constructor?: { name?: string } } | null)?.constructor?.name,
        } : undefined,
      }, { status: 500 });
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return fail500('missing-anthropic-api-key', new Error('Missing ANTHROPIC_API_KEY'));
    }

    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const forceComplete = body.force_complete === true;
    const forcedSessionId = typeof body.session_id === 'string' ? body.session_id.trim() : '';
    const countryFromBody: 'usa' = 'usa';
    const requestCountry: 'usa' = 'usa';
    const messages = Array.isArray(body.messages) ? body.messages : undefined;
    console.log('[onboarding/chat] Messages count:', messages?.length);
    const action = typeof body.action === 'string' ? body.action : null;
    const hasMessageText = typeof body.message === 'string' && body.message.trim().length > 0;
    if (!action && !hasMessageText && (!messages || messages.length === 0)) {
      console.log('[onboarding/chat] Init call - returning opening message');
      const openingMessage = "Hi! Glad you're here. Before we dig into your business, can you tell me a bit about yourself? Your name, your business name, and the best email and phone number to reach you on. Then we'll talk about what's actually going on.";

      return NextResponse.json({
        complete: false,
        next_question: openingMessage,
        show_generate_button: false,
      });
    }
    const supabase = await createClient();
    if (action === 'list') {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      const adminClient = createAdminClient();

      if (authUser) {
        const { data, error } = await adminClient
          .from('onboarding_sessions')
          .select('id, captured_business_name, status, created_at, last_activity_at, transcript')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) return fail500('list-sessions-auth', error);
        return NextResponse.json({
          sessions: (data || []).map((row: any) => ({
            id: row.id,
            business_name: row.captured_business_name,
            status: row.status,
            created_at: row.created_at,
            last_activity_at: row.last_activity_at,
            has_messages: Array.isArray(row.transcript) && row.transcript.length > 0,
          })),
        });
      }

      // Anonymous: client passes its localStorage IDs; server intersects with cookie array
      // and only returns rows the cookie authorizes.
      const requestedIdsRaw = Array.isArray((body as any).sessionIds) ? (body as any).sessionIds : [];
      const requestedIds = (requestedIdsRaw as unknown[])
        .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim());

      const cookieIds = await getSessionIdsFromCookie();
      const allowedIds = requestedIds.filter((id) => cookieIds.includes(id));

      if (allowedIds.length === 0) return NextResponse.json({ sessions: [] });

      const { data, error } = await adminClient
        .from('onboarding_sessions')
        .select('id, captured_business_name, status, created_at, last_activity_at, transcript, user_id')
        .in('id', allowedIds)
        .is('user_id', null) // anonymous sessions only
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return fail500('list-sessions-anon', error);
      return NextResponse.json({
        sessions: (data || []).map((row: any) => ({
          id: row.id,
          business_name: row.captured_business_name,
          status: row.status,
          created_at: row.created_at,
          last_activity_at: row.last_activity_at,
          has_messages: Array.isArray(row.transcript) && row.transcript.length > 0,
        })),
      });
    }

    if (action === 'load') {
      const requestedSessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
      if (!requestedSessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      const adminClient = createAdminClient();
      const cookieStore = await cookies();

      const { data: row, error: loadError } = await adminClient
        .from('onboarding_sessions')
        .select(
          'id, user_id, is_anonymous, status, transcript, business_summary, recommendations, captured_business_name, pipeline_status, pipeline_error',
        )
        .eq('id', requestedSessionId)
        .maybeSingle();

      if (loadError) return fail500('load-session-history', loadError);
      if (!row) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      if (row.user_id) {
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (row.user_id !== authUser.id) {
          const { data: roleRow } = await adminClient.from('profiles').select('role').eq('id', authUser.id).maybeSingle();
          if (roleRow?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        const cookieIds = parseSessionIdsFromCookieValueLocal(cookieStore.get(COOKIE_NAME)?.value ?? null);
        if (!cookieIds.includes(row.id)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      return NextResponse.json({
        sessionId: row.id,
        status: row.status,
        transcript: row.transcript || [],
        business_summary: row.business_summary || null,
        recommendations: row.recommendations || [],
        captured_business_name: row.captured_business_name || null,
        pipeline_status: row.pipeline_status || null,
        pipeline_error: row.pipeline_error || null,
      });
    }

    if (action === 'new') {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      if (authUser) {
        const { data, error } = await createAdminClient()
          .from('onboarding_sessions')
          .insert({
            user_id: authUser.id,
            client_id: null,
            is_anonymous: false,
            status: 'in_progress',
            language: 'en',
            country: 'usa',
            conversation_stage: 'rapport',
            transcript: [] as TranscriptEntry[],
            recommendations: [] as Recommendation[],
          })
          .select('id')
          .single();
        if (error) return fail500('new-auth-session', error);
        return NextResponse.json({ sessionId: data.id });
      }
      const newSessionId = crypto.randomUUID();
      await addSessionIdToCookie(newSessionId);
      return NextResponse.json({ sessionId: newSessionId });
    }

    if (action === 'anon-status') {
      const sid = await getOrCreateSessionId();
      const { data, error } = await createAdminClient()
        .from('onboarding_sessions')
        .select('id, transcript')
        .eq('id', sid)
        .maybeSingle();
      if (error) return fail500('anon-status', error);
      return NextResponse.json({
        sessionId: sid,
        hasMessages: Array.isArray(data?.transcript) && data!.transcript.length > 0,
      });
    }

    const trimmedMessage = typeof body.message === 'string' ? body.message.trim() : '';

    const sessionIdFromBody =
      (typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : undefined) ||
      (forcedSessionId || undefined);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    const supabaseAdmin = createAdminClient();

    let sessionId: string;

    type SessionRow = {
      id: string;
      transcript: TranscriptEntry[];
      language: 'en' | 'ar';
      status: string;
      captured_email: string | null;
      captured_phone: string | null;
      captured_business_name: string | null;
      captured_budget_range: string | null;
      business_summary: string | null;
      monthly_revenue_at_risk: number | null;
      recommendations: Recommendation[] | null;
      pipeline_status?: string | null;
      pipeline_error?: string | null;
      strategist_output?: Record<string, unknown> | null;
      pricer_output?: Record<string, unknown> | null;
      pitcher_output?: Record<string, unknown> | null;
      country?: 'usa' | null;
      detected_industry?: string | null;
      buyer_profile?: 'driver' | 'analyzer' | 'expressive' | 'amiable' | null;
      conversation_stage?: 'rapport' | 'diagnose' | 'quantify' | 'vision' | 'objection' | 'close' | null;
    };

    let sessionRow: SessionRow | null = null;

    if (user) {
      // Authenticated users: keyed by their user_id.
      const lookupId = sessionIdFromBody ?? '';
      if (lookupId) {
        const { data, error } = await supabaseAdmin
          .from('onboarding_sessions')
          .select('id, transcript, language, status, captured_email, captured_phone, captured_business_name, captured_budget_range, business_summary, monthly_revenue_at_risk, recommendations, country, detected_industry, buyer_profile, conversation_stage')
          .eq('id', lookupId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) return fail500('load-session-by-id', error);
        if (data) sessionRow = data as SessionRow;
      }

      if (!sessionRow) {
        const { data, error } = await supabaseAdmin
          .from('onboarding_sessions')
          .select('id, transcript, language, status, is_anonymous, captured_email, captured_phone, captured_business_name, captured_budget_range, business_summary, monthly_revenue_at_risk, recommendations, country, detected_industry, buyer_profile, conversation_stage')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .order('last_activity_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return fail500('load-in-progress-session-by-user', error);
        if (data) sessionRow = data as SessionRow;
      }

      if (!sessionRow) {
        // Create a new authenticated session (we use service role here and enforce ownership ourselves).
        const { data, error } = await supabaseAdmin
          .from('onboarding_sessions')
          .insert({
            user_id: user.id,
            client_id: null,
            is_anonymous: false,
            status: 'in_progress',
            language: 'en',
            country: 'usa',
            conversation_stage: 'rapport',
            transcript: [] as TranscriptEntry[],
          })
          .select('id, transcript, language, status, is_anonymous, captured_email, captured_phone, captured_business_name, captured_budget_range, business_summary, monthly_revenue_at_risk, recommendations, country, detected_industry, buyer_profile, conversation_stage')
          .single();
        if (error) return fail500('create-auth-session', error);
        sessionRow = data as SessionRow;
      }

      sessionId = sessionRow.id;
    } else {
      // Anonymous users: cookie-based session.
      // For ongoing sessions, accept any sessionIdFromBody that's in the cookie array.
      // For first-time visitors, fall back to creating one (getOrCreateSessionId).
      let cookieSessionId: string;
      if (sessionIdFromBody) {
        const allowed = await cookieHasSessionId(sessionIdFromBody);
        if (!allowed) {
          return NextResponse.json({ error: 'Session mismatch' }, { status: 403 });
        }
        cookieSessionId = sessionIdFromBody;
      } else {
        cookieSessionId = await getOrCreateSessionId();
      }

      sessionId = cookieSessionId;
      const { data, error } = await supabaseAdmin
        .from('onboarding_sessions')
        .select('id, transcript, language, status, is_anonymous, captured_email, captured_phone, captured_business_name, captured_budget_range, business_summary, monthly_revenue_at_risk, recommendations, country, detected_industry, buyer_profile, conversation_stage')
        .eq('id', sessionId)
        .maybeSingle();
      if (error) return fail500('load-anon-session-by-cookie-id', error);
      if (data) {
        sessionRow = data as SessionRow;
      }

      if (!sessionRow) {
        const ip = getClientIp(request);

        // Rate limit anonymous session creation.
        const { data: rateRow } = await supabaseAdmin
          .from('onboarding_rate_limits')
          .select('ip_address, session_count, window_start')
          .eq('ip_address', ip)
          .maybeSingle();

        const now = Date.now();
        const windowMs = 60 * 60 * 1000;

        if (rateRow && rateRow.window_start) {
          const windowStartMs = new Date(rateRow.window_start as string).getTime();
          const withinWindow = now - windowStartMs < windowMs;
          const currentCount = Number(rateRow.session_count ?? 0);

          if (withinWindow && currentCount > 3) {
            return NextResponse.json(
              { error: 'Too many requests, please try again later.' },
              { status: 429 }
            );
          }

          if (withinWindow) {
            await supabaseAdmin
              .from('onboarding_rate_limits')
              .update({ session_count: currentCount + 1 })
              .eq('ip_address', ip);
          } else {
            await supabaseAdmin
              .from('onboarding_rate_limits')
              .upsert({ ip_address: ip, session_count: 1, window_start: new Date().toISOString() }, { onConflict: 'ip_address' });
          }
        } else {
          await supabaseAdmin
            .from('onboarding_rate_limits')
            .upsert({ ip_address: ip, session_count: 1, window_start: new Date().toISOString() }, { onConflict: 'ip_address' });
        }

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('onboarding_sessions')
          .insert({
            id: sessionId,
            user_id: null,
            client_id: null,
            captured_email: null,
            captured_phone: null,
            captured_business_name: null,
            status: 'in_progress',
            is_anonymous: true,
            language: 'en',
            country: 'usa',
            conversation_stage: 'rapport',
            transcript: [] as TranscriptEntry[],
            recommendations: [] as Recommendation[],
          })
          .select('id, transcript, language, status, captured_email, captured_phone, captured_business_name, captured_budget_range, business_summary, monthly_revenue_at_risk, recommendations, is_anonymous, country, detected_industry, buyer_profile, conversation_stage')
          .single();

        if (insertError) return fail500('create-anon-session', insertError);
        await addSessionIdToCookie(sessionId);
        sessionRow = inserted as SessionRow;
      }

    }

    if (!sessionRow) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (sessionRow.country !== 'usa') {
      await supabaseAdmin
        .from('onboarding_sessions')
        .update({ country: 'usa' })
        .eq('id', sessionRow.id);
      sessionRow.country = 'usa';
    }

    if (forceComplete === true) {
      console.log('[FORCE-COMPLETE] Triggered for session:', sessionIdFromBody || sessionRow.id);
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const incomingMessages = Array.isArray(messages) ? messages : [];
      const normalizedForceMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
        incomingMessages
          .map((m) => {
            if (!isRecord(m)) return null;
            const role = m.role === 'user' || m.role === 'assistant'
              ? m.role
              : (m.sender === 'user' || m.sender === 'ai'
                ? (m.sender === 'user' ? 'user' : 'assistant')
                : null);
            if (!role || typeof m.content !== 'string') return null;
            return { role, content: m.content };
          })
          .filter((m): m is { role: 'user' | 'assistant'; content: string } => m !== null);

      // USA deployments: prefer SMS/Email in recommendations; the schema below still lists "WhatsApp" as a legacy channel literal for model compatibility (follow-up cleanup).
      const extractionMessages = [
        {
          role: 'user' as const,
          content: `Here is a full consultation transcript between a business consultant and a business owner:\n\n${normalizedForceMessages.map((m) => `${m.role === 'user' ? 'BUSINESS OWNER' : 'CONSULTANT'}: ${m.content}`).join('\n\n')}\n\nBased on this conversation, generate a complete analysis. Output ONLY a raw JSON object with this EXACT schema:\n\n{\n  "complete": true,\n  "next_question": "Thanks for sharing everything. Your personalized plan is being built right now. You will see it in just a few seconds.",\n  "business_summary": "3-4 sentences summarizing this specific business, their volume, their pain points, using their actual words and numbers",\n  "monthly_revenue_at_risk": <number — estimate monthly money they are losing to manual processes, no-shows, slow responses, etc. Use their numbers. Must be > 0>,\n  "captured_budget_range": "under_300" | "300_to_1000" | "1000_plus" | "not_sure",\n  "recommendations": [\n    {\n      "title": "Short name (max 6 words)",\n      "problem": "20+ words describing their actual pain using their words",\n      "solution": "20+ words describing what we build, in plain English, no tech jargon",\n      "current_pain": "One vivid sentence about the cost of not fixing this",\n      "after_state": "One vivid sentence about the new reality",\n      "time_saved_hours_per_month": <number based on their volume>,\n      "estimated_roi": "Saves ~$X/month. Show your math.",\n      "impact_metric": { "metric_name": "...", "before": "...", "after": "...", "unit": "time"|"percentage"|"hours"|"count" },\n      "priority": "high"|"medium"|"low",\n      "channel": "WhatsApp"|"SMS"|"Email"|"Instagram"|"Dashboard"|"Custom",\n      "custom_build": false\n    }\n  ]\n}\n\nGenerate 3-6 recommendations. Use ONLY data from the conversation. Be specific. Output ONLY raw JSON, nothing else.`,
        },
      ];

      const extractionResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: 'You are a data extraction expert. Read the conversation and produce structured JSON. Output ONLY a raw JSON object. No text before or after. No markdown fences.',
        messages: extractionMessages,
      });

      const extractedText = extractionResponse.content
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { type: string; text?: string }) => b.text || '')
        .join('\n');

      console.log('[FORCE-COMPLETE] Extraction response (first 200):', extractedText.substring(0, 200));
      const parsed = extractJSON(extractedText) as Record<string, any>;
      parsed.complete = true;
      console.log('[FORCE-COMPLETE] Parsed keys:', Object.keys(parsed || {}));

      const normalizedRecommendations = Array.isArray(parsed.recommendations)
        ? importedNormalizeRecommendations(parsed.recommendations)
        : [];
      const finalForceTranscript = normalizedForceMessages.length
        ? normalizedForceMessages
        : (sessionRow.transcript ?? []).map((entry) => ({ role: entry.role, content: entry.content }));

      let capturedFacts = parsed.captured_facts ? normalizeCapturedFacts(parsed.captured_facts) : null;
      if (!capturedFacts) {
        capturedFacts = await extractCapturedFactsFromTranscript(finalForceTranscript);
      }

      const mergedEmail = String(parsed?.capture?.email || sessionRow.captured_email || '').trim();
      const mergedPhone = String(parsed?.capture?.phone || sessionRow.captured_phone || '').trim();
      const transcriptForGuard: TranscriptEntry[] = finalForceTranscript.map((entry) => ({
        role: entry.role,
        content: entry.content,
        created_at: new Date().toISOString(),
      }));
      const mergedRowForce: ContactGuardRow = {
        id: sessionRow.id,
        captured_email: mergedEmail || null,
        captured_phone: mergedPhone || null,
      };
      const guardForce = await respondIfContactGuardFails(supabaseAdmin, mergedRowForce, transcriptForGuard);
      if (guardForce) return guardForce;

      const email = mergedEmail;
      const phone = mergedPhone;

      const consultantOutput: ConsultantOutput = {
        business_summary: String(parsed.business_summary || ''),
        contact: {
          name: String(sessionRow.captured_business_name || ''),
          email,
          phone,
          business_name: String(sessionRow.captured_business_name || ''),
        },
        raw_data: {
          budget_range: (parsed.captured_budget_range || 'not_sure') as ConsultantOutput['raw_data']['budget_range'],
        },
        captured_facts: capturedFacts ?? undefined,
        transcript: finalForceTranscript,
      };

      const forceAssistantMessage: TranscriptEntry = {
        role: 'assistant',
        content: COMPLETION_CLIENT_MESSAGE,
        created_at: new Date().toISOString(),
      };
      const persistedTranscript: TranscriptEntry[] = [
        ...finalForceTranscript.map((entry) => ({
          role: entry.role,
          content: entry.content,
          created_at: new Date().toISOString(),
        })),
        forceAssistantMessage,
      ];

      const { error: updateError } = await supabaseAdmin
        .from('onboarding_sessions')
        .update({
          business_summary: String(parsed.business_summary || ''),
          monthly_revenue_at_risk: Number(parsed.monthly_revenue_at_risk || 0),
          captured_budget_range: parsed.captured_budget_range || 'not_sure',
          captured_facts: capturedFacts ?? null,
          captured_email: email,
          captured_phone: phone,
          country: 'usa',
          conversation_stage: 'close',
          status: 'completed',
          pipeline_status: 'running',
          recommendations: normalizedRecommendations,
          transcript: persistedTranscript,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionRow.id);

      if (updateError) {
        console.error('[FORCE-COMPLETE] DB error:', updateError);
      }

      console.log('[FORCE-COMPLETE] Triggering pipeline...');
      runPipeline(sessionRow.id, consultantOutput).catch((err) => {
        console.error('[FORCE-COMPLETE] Pipeline failed:', (err as Error)?.message || err);
      });

      return NextResponse.json({
        complete: true,
        next_question: COMPLETION_CLIENT_MESSAGE,
        session_id: sessionRow.id,
      });
    }

    if (sessionRow.status === 'completed') {
      return NextResponse.json({
        complete: true,
        next_question: 'Session already completed',
        session_id: sessionRow.id,
      });
    }

    const existingTranscript = sessionRow.transcript ?? [];
    const isBootstrap =
      existingTranscript.length === 0 &&
      (trimmedMessage === '' || trimmedMessage === 'Start' || trimmedMessage === 'ابدأ');

    if (!isBootstrap && !trimmedMessage) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const userMessage: TranscriptEntry | null = isBootstrap
      ? null
      : { role: 'user', content: trimmedMessage, created_at: new Date().toISOString() };

    const transcriptAfterUser = (userMessage
      ? [...existingTranscript, userMessage]
      : existingTranscript) as TranscriptEntry[];

    const OPENING_TRIGGER =
      '(The consultation chat just opened. The user has not sent a message yet. Respond with ONLY the raw JSON object required by your output format. Use this exact next_question text: "Hi! Glad you\'re here. Before we dig into your business, can you tell me a bit about yourself? Your name, your business name, and the best email and phone number to reach you on. Then we\'ll talk about what\'s actually going on.")';

    const baseMessagesForClaude: TranscriptEntry[] =
      isBootstrap && existingTranscript.length === 0
        ? [{ role: 'user', content: OPENING_TRIGGER, created_at: new Date().toISOString() }]
        : transcriptAfterUser;

    // Keep JSON format compliance sticky by reinforcing instruction on the latest user turn.
    const messagesForClaude: TranscriptEntry[] = baseMessagesForClaude.map((msg, index) => {
      if (index === baseMessagesForClaude.length - 1 && msg.role === 'user') {
        return {
          ...msg,
          content: `${msg.content}\n\n[SYSTEM REMINDER: You MUST respond with a raw JSON object. No plain text before or after. Start with { and end with }. If you are ready to complete, set "complete": true.]`,
        };
      }
      return msg;
    });

    // Detect language from first real user message and persist it for downstream pages.
    if (userMessage && existingTranscript.length === 0) {
      const detectedLanguage = detectLanguageFromText(userMessage.content);
      await supabaseAdmin
        .from('onboarding_sessions')
        .update({ language: detectedLanguage })
        .eq('id', sessionRow.id);
    }

    const contextLine = user
      ? 'AUTHENTICATED user (already signed up)'
      : 'ANONYMOUS visitor (hasn\'t created an account)';
    const contextBlock = `═══ CURRENT SESSION CONTEXT ═══
Country: usa
Detected industry: ${sessionRow.detected_industry || 'not yet classified'}
Buyer profile: ${sessionRow.buyer_profile || 'not yet profiled'}
Current conversation stage: ${sessionRow.conversation_stage || 'rapport'}
Message count: ${messagesForClaude.length}`;
    const missingContact = getMissingContactFields({
      captured_email: sessionRow.captured_email,
      captured_phone: sessionRow.captured_phone,
    });
    console.log('Missing contact fields:', missingContact);
    const system = `${contextLine}\n\n${CONSULTANT_SYSTEM_PROMPT}\n\n${CONSULTANT_CONTACT_RULES_APPENDIX}\n${contextBlock}`;

    const extractedText = await callClaude(messagesForClaude, system);
    console.log('[DEBUG] Raw extracted text (first 300 chars):', extractedText.substring(0, 300));

    const parsed = extractJSON(extractedText) as Record<string, any>;
    console.log('[DEBUG] Parsed result keys:', Object.keys(parsed || {}));
    console.log('[DEBUG] parsed.complete value:', parsed?.complete, 'type:', typeof parsed?.complete);

    if (parsed.complete === 'true' || parsed.complete === true) {
      parsed.complete = true;
    } else {
      parsed.complete = false;
    }
    console.log('[DEBUG] Final parsed.complete:', parsed.complete);
    console.log('[DEBUG] Complete check:', parsed.complete === true, 'or string:', parsed.complete === 'true');

    const layer2Response = await tryFinalizeWhenRawCompleteTrueUnparsed(
      extractedText,
      parsed,
      transcriptAfterUser,
      sessionRow,
      supabaseAdmin,
    );
    if (layer2Response) return layer2Response;

    if (parsed.complete === false && typeof parsed.next_question === 'string') {
      const text = parsed.next_question.toLowerCase();
      const completionPhrases = [
        'here\'s what i generated',
        'here is your plan',
        'putting together',
        'put together your',
        'building your plan',
        'have everything i need',
        'have what i need',
        'let me build',
        'generating your',
        'your personalized plan',
        'the plan has',
        'here\'s your plan',
        'plan is ready',
        'core plan',
        'that\'s the core plan',
        'here\'s what i\'d recommend',
        'here are my recommendations',
        'i have enough',
        'i\'ve got enough',
        'let me put this together',
        'ready to generate',
        'plan for you',
        'build your plan',
      ];

      const looksComplete = completionPhrases.some((phrase) => text.includes(phrase));
      const messageCount = Array.isArray(messages) ? messages.length : transcriptAfterUser.length;

      if (looksComplete && messageCount >= 6) {
        console.log('[COMPLETION] Force-detected completion from plain text');
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const forceCompleteResponse = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: 'You are a data extractor. Read the conversation below and produce the completion JSON. Output ONLY a raw JSON object, nothing else.',
          messages: [
            ...baseMessagesForClaude.map((m) => ({ role: m.role, content: m.content })),
            {
              role: 'assistant',
              content: parsed.next_question,
            },
            {
              role: 'user',
              content: `Based on the entire conversation above, generate the completion JSON with these exact fields:
{
  "complete": true,
  "next_question": "Thanks for sharing all of that. Your personalized plan is being built right now. You will see it in a few seconds.",
  "business_summary": "3-4 sentence summary of this specific business",
  "monthly_revenue_at_risk": <number>,
  "captured_budget_range": "under_300" | "300_to_1000" | "1000_plus" | "not_sure",
  "recommendations": [array of 3-6 recommendations with title, problem, solution, current_pain, after_state, time_saved_hours_per_month, estimated_roi, impact_metric, priority, channel]
}
Output ONLY the JSON. No text before or after.`,
            },
          ],
        });

        const forceText = forceCompleteResponse.content
          .filter((b: { type: string }) => b.type === 'text')
          .map((b: { type: string; text?: string }) => b.text || '')
          .join('\n');

        const forceParsed = extractJSON(forceText) as Record<string, any>;
        if (forceParsed.complete === true || forceParsed.recommendations) {
          forceParsed.complete = true;
          console.log('[COMPLETION] Force extraction succeeded');
          Object.assign(parsed, forceParsed);
        }
      }
    }

    if (parsed.complete === false) {
      const nextQuestion = String(parsed.next_question ?? 'Could you tell me a little more?');
      const showGenerateButton = parsed.show_generate_button === true;
      const assistantMessage: TranscriptEntry = { role: 'assistant', content: nextQuestion, created_at: new Date().toISOString() };

      const capture = importedCoerceCapture(parsed.capture);
      const updatePayload: Record<string, unknown> = {
        transcript: [...transcriptAfterUser, assistantMessage] as TranscriptEntry[],
      };

      if (capture?.email) updatePayload.captured_email = capture.email;
      if (capture?.phone) updatePayload.captured_phone = capture.phone;
      if (capture?.business_name) updatePayload.captured_business_name = capture.business_name;
      if (capture?.budget_range) updatePayload.captured_budget_range = capture.budget_range;
      if (capture?.detected_industry) updatePayload.detected_industry = capture.detected_industry;
      if (capture?.buyer_profile) updatePayload.buyer_profile = capture.buyer_profile;
      if (capture?.conversation_stage) updatePayload.conversation_stage = capture.conversation_stage;

      const { error } = await supabaseAdmin
        .from('onboarding_sessions')
        .update(updatePayload)
        .eq('id', sessionRow.id);

      if (error) return fail500('save-in-progress-session', error);

      return NextResponse.json({
        complete: false,
        next_question: nextQuestion,
        show_generate_button: showGenerateButton,
        session_id: sessionRow.id,
      });
    }

    console.log('[DEBUG] INSIDE COMPLETE BLOCK');
    if (parsed.complete === true) {
      console.log('[COMPLETION] Detected complete=true, processing...');
      const parsedCapture = isRecord(parsed.capture) ? parsed.capture as Record<string, any> : {};
      const mergedEmail = String(parsedCapture.email || sessionRow?.captured_email || '').trim();
      const mergedPhone = String(parsedCapture.phone || sessionRow?.captured_phone || '').trim();
      const mergedRowMain: ContactGuardRow = {
        id: sessionRow.id,
        captured_email: mergedEmail || null,
        captured_phone: mergedPhone || null,
      };
      const guardMain = await respondIfContactGuardFails(supabaseAdmin, mergedRowMain, transcriptAfterUser);
      if (guardMain) return guardMain;

      const email = mergedEmail;
      const phone = mergedPhone;

      const assistantMessage: TranscriptEntry = {
        role: 'assistant',
        content: COMPLETION_CLIENT_MESSAGE,
        created_at: new Date().toISOString(),
      };
      const completeTranscript = [...transcriptAfterUser, assistantMessage] as TranscriptEntry[];

      let capturedFacts = parsed.captured_facts ? normalizeCapturedFacts(parsed.captured_facts) : null;
      if (!capturedFacts) {
        capturedFacts = await extractCapturedFactsFromTranscript(
          completeTranscript.map((entry) => ({ role: entry.role, content: entry.content }))
        );
      }

      const consultantOutput = {
        business_summary: String(parsed.business_summary || ''),
        contact: {
          name: String(parsedCapture.contact_name || sessionRow?.captured_business_name || ''),
          email,
          phone,
          business_name: String(parsedCapture.business_name || sessionRow?.captured_business_name || ''),
        },
        raw_data: {
          budget_range: (parsed.captured_budget_range || sessionRow?.captured_budget_range || 'not_sure') as ConsultantOutput['raw_data']['budget_range'],
        },
        captured_facts: capturedFacts ?? undefined,
        transcript: completeTranscript.map((entry) => ({ role: entry.role, content: entry.content })),
      } satisfies ConsultantOutput;

      console.log('[COMPLETION] Saving to database...');
      const { error: updateError } = await supabaseAdmin
        .from('onboarding_sessions')
        .update({
          business_summary: String(parsed.business_summary || consultantOutput.business_summary),
          captured_email: consultantOutput.contact.email || sessionRow?.captured_email,
          captured_phone: consultantOutput.contact.phone || sessionRow?.captured_phone,
          captured_business_name: consultantOutput.contact.business_name || sessionRow?.captured_business_name,
          captured_budget_range: consultantOutput.raw_data.budget_range,
          detected_industry: parsedCapture.detected_industry || sessionRow?.detected_industry || null,
          buyer_profile: parsedCapture.buyer_profile || sessionRow?.buyer_profile || null,
          conversation_stage: parsedCapture.conversation_stage || 'close',
          monthly_revenue_at_risk: Number(parsed.monthly_revenue_at_risk || 0),
          captured_facts: capturedFacts ?? null,
          status: 'completed',
          pipeline_status: 'running',
          recommendations: Array.isArray(parsed.recommendations) ? importedNormalizeRecommendations(parsed.recommendations) : [],
          transcript: completeTranscript,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionRow.id);

      if (updateError) {
        console.error('[COMPLETION] Database update error:', updateError);
      } else {
        console.log('[COMPLETION] Database updated successfully');
      }

      console.log('[DEBUG] About to call runPipeline');
      console.log('[onboarding/chat] Complete=true, triggering pipeline for session:', sessionRow.id);
      runPipeline(sessionRow.id, consultantOutput).catch((pipelineError) => {
        console.log('[DEBUG] Pipeline error:', (pipelineError as Error)?.message || pipelineError);
        console.error('[COMPLETION] Pipeline failed:', (pipelineError as Error)?.message || pipelineError);
      });

      console.log('[COMPLETION] Returning redirect response');
      return NextResponse.json({
        complete: true,
        next_question: COMPLETION_CLIENT_MESSAGE,
        session_id: sessionRow.id,
      });
    }
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('[onboarding/chat] OUTERMOST CATCH');
    console.error('Type:', error?.constructor?.name);
    console.error('Message:', error?.message);
    console.error('Status:', error?.status);
    console.error('Stack:', error?.stack);
    console.error('Anthropic error?', error?.error);
    console.error('Full JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2));
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      error: 'Failed to start consultation',
      debug: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        type: error?.constructor?.name,
        status: error?.status,
      }
        : undefined,
    }, { status: 500 });
  }
}

