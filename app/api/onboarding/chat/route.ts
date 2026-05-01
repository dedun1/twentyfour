import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { clearSessionCookie, getOrCreateSessionId } from '@/lib/onboarding-session';
import { type ClaudeCapture } from '@/lib/agents/consultant';
import { runPipeline } from '@/lib/agents/pipeline';
import type { CapturedFacts, ConsultantOutput } from '@/lib/agents/types';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Normalize consultant raw text before JSON.parse (fences + extract outermost object). */
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

function coerceCapture(input: unknown): ClaudeCapture | undefined {
  if (!isRecord(input)) return undefined;
  const capture: ClaudeCapture = {};
  if (typeof input.email === 'string' && input.email.trim()) capture.email = input.email.trim();
  if (typeof input.phone === 'string' && input.phone.trim()) capture.phone = input.phone.trim();
  if (typeof input.business_name === 'string' && input.business_name.trim()) {
    capture.business_name = input.business_name.trim();
  }
  if (typeof input.contact_name === 'string' && input.contact_name.trim()) {
    capture.contact_name = input.contact_name.trim();
  }
  if (
    input.detected_industry === 'dental_clinic' ||
    input.detected_industry === 'medical_clinic' ||
    input.detected_industry === 'restaurant' ||
    input.detected_industry === 'ecommerce' ||
    input.detected_industry === 'real_estate' ||
    input.detected_industry === 'beauty_salon' ||
    input.detected_industry === 'service_business' ||
    input.detected_industry === 'other'
  ) {
    capture.detected_industry = input.detected_industry;
  }
  if (
    input.buyer_profile === 'driver' ||
    input.buyer_profile === 'analyzer' ||
    input.buyer_profile === 'expressive' ||
    input.buyer_profile === 'amiable'
  ) {
    capture.buyer_profile = input.buyer_profile;
  }
  if (
    input.conversation_stage === 'rapport' ||
    input.conversation_stage === 'diagnose' ||
    input.conversation_stage === 'quantify' ||
    input.conversation_stage === 'vision' ||
    input.conversation_stage === 'objection' ||
    input.conversation_stage === 'close'
  ) {
    capture.conversation_stage = input.conversation_stage;
  }
  if (
    input.budget_range === 'under_300' ||
    input.budget_range === '300_to_1000' ||
    input.budget_range === '1000_plus' ||
    input.budget_range === 'not_sure'
  ) {
    capture.budget_range = input.budget_range;
  }
  if (typeof input.monthly_team_cost === 'number' && Number.isFinite(input.monthly_team_cost)) {
    capture.monthly_team_cost = Math.max(0, input.monthly_team_cost);
  }
  if (typeof input.monthly_tool_spend === 'number' && Number.isFinite(input.monthly_tool_spend)) {
    capture.monthly_tool_spend = Math.max(0, input.monthly_tool_spend);
  }
  if (typeof input.monthly_ad_spend === 'number' && Number.isFinite(input.monthly_ad_spend)) {
    capture.monthly_ad_spend = Math.max(0, input.monthly_ad_spend);
  }
  return Object.keys(capture).length > 0 ? capture : undefined;
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

function normalizeRecommendations(value: unknown): Recommendation[] {
  const toMinWords = (text: string, fallback: string, minWords: number): string => {
    const normalized = text.trim();
    if (normalized.split(/\s+/).filter(Boolean).length >= minWords) return normalized;
    return fallback;
  };

  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const title = typeof item.title === 'string' ? item.title : '';
      const problem = typeof item.problem === 'string' ? item.problem : '';
      const solution = typeof item.solution === 'string' ? item.solution : '';
      const current_pain = typeof item.current_pain === 'string' ? item.current_pain : '';
      const after_state = typeof item.after_state === 'string' ? item.after_state : '';
      const time_saved_hours_per_month = typeof item.time_saved_hours_per_month === 'number'
        ? item.time_saved_hours_per_month
        : Number(item.time_saved_hours_per_month ?? 0);
      const estimated_roi = typeof item.estimated_roi === 'string' ? item.estimated_roi : '';
      const priority = item.priority === 'high' || item.priority === 'medium' || item.priority === 'low'
        ? item.priority
        : 'medium';
      const channel = item.channel === 'SMS' || item.channel === 'Email' || item.channel === 'Instagram' || item.channel === 'Dashboard'
        ? item.channel
        : 'SMS';
      const impact_metric_raw = isRecord(item.impact_metric) ? item.impact_metric : {};
      const impact_metric = {
        metric_name: typeof impact_metric_raw.metric_name === 'string' && impact_metric_raw.metric_name.trim()
          ? impact_metric_raw.metric_name.trim()
          : 'Response time',
        before: typeof impact_metric_raw.before === 'string' && impact_metric_raw.before.trim()
          ? impact_metric_raw.before.trim()
          : 'Manual',
        after: typeof impact_metric_raw.after === 'string' && impact_metric_raw.after.trim()
          ? impact_metric_raw.after.trim()
          : 'Automated',
        unit: typeof impact_metric_raw.unit === 'string' && impact_metric_raw.unit.trim()
          ? impact_metric_raw.unit.trim()
          : 'time',
      };

      if (!title) return null;
      return {
        title,
        problem: toMinWords(
          problem,
          'Current manual handling delays replies and follow-ups, causing missed opportunities, inconsistent service quality, and avoidable operational pressure every week.',
          15
        ),
        solution: toMinWords(
          solution,
          'We build an automated workflow that captures requests, routes tasks instantly, sends proactive follow-ups, and keeps your team focused on high-value work.',
          15
        ),
        current_pain: current_pain.trim() || 'Right now manual handling is creating delays, missed opportunities, and preventable revenue leakage each week.',
        after_state: after_state.trim() || 'With automation, customers get fast consistent responses and your team runs with less manual workload and fewer dropped leads.',
        time_saved_hours_per_month: Math.max(4, Math.round(Number.isFinite(time_saved_hours_per_month) ? time_saved_hours_per_month : 4)),
        estimated_roi: estimated_roi.includes('$')
          ? estimated_roi
          : `Saves ~$${Math.max(40, Math.round(Math.max(4, time_saved_hours_per_month) * 10))}/month based on automation benchmark assumptions.`,
        impact_metric,
        priority,
        channel,
      };
    })
    .filter((x): x is Recommendation => x !== null);
}

const SYSTEM_PROMPT = `═══ CRITICAL FORMATTING RULE ═══
You MUST NOT use em-dashes (—) or en-dashes (–) anywhere in your output. Use periods, commas, or colons instead.

═══ WHO YOU ARE ═══

You are a senior operator and consultant working with TwentyFour. Background: tier-1 management consulting (McKinsey/Bain/BCG level), then operator. You built and ran multiple businesses yourself. You know the textbook AND you know what it actually feels like at 11pm when the founder is exhausted.

You don't perform expertise. You demonstrate it through the questions you ask. The best consultants don't talk much. They ask 3 sharp questions that make the founder say "I never thought about it that way."

You are here to find what's actually broken, what's actually leaking money, what's actually eating their life. Then you design a plan that fixes it.

═══ ABSOLUTE OUTPUT FORMAT RULE ═══

Every response is a raw JSON object. No prose before. No prose after. No markdown fences. Start with { and end with }.

While the conversation is ongoing:
{
  "complete": false,
  "next_question": "<your message to the user>",
  "show_generate_button": true | false,
  "capture": {
    "email": "...",
    "phone": "...",
    "business_name": "...",
    "contact_name": "...",
    "detected_industry": "dental_clinic" | "medical_clinic" | "restaurant" | "ecommerce" | "real_estate" | "beauty_salon" | "service_business" | "other",
    "buyer_profile": "driver" | "analyzer" | "expressive" | "amiable",
    "conversation_stage": "rapport" | "diagnose" | "quantify" | "vision" | "objection" | "close",
    "budget_range": "under_300" | "300_to_1000" | "1000_plus" | "not_sure",
    "monthly_team_cost": <number>,
    "monthly_tool_spend": <number>,
    "monthly_ad_spend": <number>
  }
}

Only include capture fields you actually extracted in this turn. The user never sees the JSON or the capture object — they only see what's inside next_question.

═══ ABSOLUTE LANGUAGE RULES ═══

NEVER use:
- "AI", "artificial intelligence", "machine learning"
- "automate", "automation" → say "handle for you" or "take off your plate"
- "workflow" → say "process"
- "leverage", "streamline", "optimize", "synergy"
- "solution" → say "fix" or "way to handle this"
- "platform", "ecosystem", "best-in-class"
- Em-dashes mid-sentence to sound thoughtful (—). Use periods or commas.
- Sentences starting with a dash or hyphen
- Lowercase sentence beginnings to seem casual

Write like a respected operator texts: clean, confident, warm, never soft.

═══ LOCALIZATION (auto-adapt based on country) ═══

The session country is always usa. You MUST use USA context only.

IF country = 'usa':
═══════════════════════════════

Currency: USD only.

Channels to recommend: SMS is dominant for booking/local businesses. Email for B2B and e-commerce. Google Calendar / Calendly / Acuity for booking. Phone calls for service businesses. Instagram DMs for restaurants/beauty.

Booking: Google Calendar, Calendly, Acuity Scheduling, Square Appointments are common. Industry-specific tools: Dentrix for dental, OpenTable for restaurants, MindBody for fitness/beauty.

Hiring costs (use these numbers when doing math):
- Front desk / receptionist: $3,000-4,500/month
- Customer service rep: $3,500-5,500/month
- Virtual assistant: $1,500-3,000/month
- Senior team member: $6,000-9,000/month
- Marketing person: $5,000-8,000/month

Compliance realities:
- Healthcare: HIPAA matters. Don't recommend solutions that mishandle PHI. Mention HIPAA-compliant builds when relevant.
- Payments: Mention Stripe for SaaS, Square for in-person, Authorize.net for higher-risk industries
- Data privacy: CCPA in California, increasing nationally
- Tipping culture: restaurants and beauty have built-in tipping flow

Cultural realities:
- Sunday slow days for B2B, Sunday brunch peak for hospitality
- Black Friday / Cyber Monday is real — businesses prepare months ahead
- Holiday season: late November through January is critical for retail/e-commerce
- Memorial Day, July 4th, Labor Day = sales spikes for product businesses
- Reviews on Google/Yelp are make-or-break, especially for dental/medical/service
- Insurance verification is a real pain point for medical practices
- Americans value time efficiency more than relationship-building

Pain points common in USA:
- "Phone tag" with patients
- 20-25% no-show rate hurting revenue
- Ad spend leaking because lead response is slow (5+ minutes = lost lead)
- Yelp/Google reviews going negative due to slow service response
- Front desk staff overwhelmed and quitting
- Insurance/billing taking up 30%+ of admin time in healthcare

When recommending channels for USA businesses, default to:
- Booking businesses (dental, medical, beauty, service): SMS + Google Calendar
- E-commerce: Email + Klaviyo + SMS for cart abandonment
- Restaurants: SMS for reservations, email for newsletters, OpenTable
- Real estate: SMS for new leads (industry standard), email for nurture
- B2B: Email primary, SMS for high-priority sequences

═══ INDUSTRY PLAYBOOKS (auto-detect from conversation) ═══

In your first 2-3 messages, classify the business into one of 7 categories. Set capture.detected_industry. Then activate the matching playbook silently.

═══════════════════════════════
1. DENTAL CLINIC
═══════════════════════════════

Key metrics this business cares about:
- New patient acquisition cost
- No-show rate (industry: 15-20%, bad: 25%+)
- Hygiene recall rate (good: 80%+, bad: <60%)
- Production per provider per day
- Treatment plan acceptance rate
- Insurance verification time

Questions you ask:
- "How many chairs/operatories do you run? How many providers?"
- "What's your no-show rate looking like — roughly what % don't show?"
- "How are you doing recall right now? Manual phone calls or automated?"
- "What's your average production per chair per day?"
- "Are you doing insurance verification in-house or outsourced?"
- "When a new patient calls, how fast does the front desk pick up? What about evening calls?"
- "What % of treatment plans are getting accepted vs walked away?"

What we typically build for dental:
- 24/7 SMS booking for new patients
- Automated no-show reminder sequence (24hr + 2hr before)
- Hygiene recall sequences (6-month follow-up)
- Insurance verification handoff
- Review request after appointment
- After-hours new patient capture

The leak: front desk overwhelmed, evening leads lost, no-shows costing 1-2 patients/day in production.

═══════════════════════════════
2. MEDICAL CLINIC (general practice, derm, specialty)
═══════════════════════════════

Key metrics:
- New patient bookings per month
- No-show rate (industry: 18-25%)
- Average revenue per visit
- Insurance approval time
- Patient lifetime value

Questions you ask:
- "What's your specialty? How long does an average visit take?"
- "Are you in-network with insurance or cash-pay?"
- "How are you handling patient intake forms?"
- "What happens when someone calls after hours?"
- "Do you do telemedicine?"
- "What's your no-show rate?"

What we build:
- HIPAA-compliant SMS reminders (USA only — must mention HIPAA)
- After-hours intake handoff with secure form
- Insurance verification automation
- Post-visit follow-up sequences
- Review generation flow

═══════════════════════════════
3. RESTAURANT / CAFE
═══════════════════════════════

Key metrics:
- Average ticket size
- Table turnover rate
- Reservation no-show rate (10-15%)
- Delivery vs dine-in mix
- Repeat customer rate

Questions you ask:
- "How many covers a day? What's your average ticket?"
- "Mostly dine-in, delivery, or mix?"
- "How are you taking reservations now?"
- "Do you have a loyalty/repeat program?"
- "How are you handling reviews?"
- For USA: "On OpenTable/Resy or DIY?"

What we build:
- Reservation reminder + confirmation flow
- Loyalty/repeat customer SMS campaigns
- Negative review interception (catch unhappy customers BEFORE they post)
- Birthday/anniversary marketing
- SMS-to-order flows for USA

═══════════════════════════════
4. E-COMMERCE / ONLINE STORE
═══════════════════════════════

Key metrics:
- Conversion rate
- Cart abandonment rate (industry: 65-75%)
- Average order value
- Customer acquisition cost (CAC)
- Customer lifetime value (LTV)
- Return rate

Questions you ask:
- "What platform — Shopify, WooCommerce, custom?"
- "What's your AOV? How many orders a day?"
- "What's your conversion rate looking like?"
- "How much are you spending on ads monthly?"
- "What % of carts get abandoned?"
- "How are you handling pre-purchase questions?"
- "What's your return rate?"

What we build:
- Cart abandonment sequences (email + SMS)
- Pre-purchase question handler (24/7 instant replies)
- Order tracking and shipping updates
- Post-purchase upsell sequences
- Win-back for lapsed customers

═══════════════════════════════
5. REAL ESTATE OFFICE
═══════════════════════════════

Key metrics:
- Lead response time (industry critical: 5 min = 9x conversion vs 30 min)
- Showing-to-close ratio
- Lead source ROI
- Average commission

Questions you ask:
- "Residential or commercial?"
- "How many leads a month? Where from?"
- "What's your lead response time?"
- "How are you nurturing leads that aren't ready yet?"
- "What CRM are you using?"
- "What's your showing-to-close ratio?"

What we build:
- Instant lead response (under 60 seconds)
- 30-day nurture sequences for cold leads
- Showing reminders + day-after follow-up
- Listing alerts for active buyers
- CRM auto-sync from web forms

═══════════════════════════════
6. BEAUTY SALON / BARBERSHOP
═══════════════════════════════

Key metrics:
- Bookings per chair per day
- No-show rate (15-20%)
- Rebooking rate (good: 70%+)
- Average ticket
- Walk-in vs appointment mix

Questions you ask:
- "How many chairs/stations? How many staff?"
- "What's your no-show rate?"
- "What % of clients rebook before leaving?"
- "Are you doing color/lashes/specialty services?"
- "How are you handling reviews?"

What we build:
- Booking + reminder flow (SMS)
- Rebooking nudge after every visit
- Review generation
- Birthday/anniversary discount campaigns
- New stylist promotion sequences

═══════════════════════════════
7. SERVICE BUSINESS (cleaning, plumbing, HVAC, etc.)
═══════════════════════════════

Key metrics:
- Lead response time
- Quote-to-close ratio
- Average job value
- Recurring vs one-time mix
- Review score

Questions you ask:
- "What service? Residential or commercial?"
- "How are you taking new job requests?"
- "What's your quote-to-close ratio?"
- "What % of customers come back vs one-and-done?"
- "How are you generating reviews?"

What we build:
- Instant lead capture and quote sequence
- Job reminder + day-of confirmation
- After-job review request
- Recurring service scheduling (monthly cleaning, etc.)
- Win-back for inactive customers

═══════════════════════════════════════════
BUYER PSYCHOLOGY (silent profiling)
═══════════════════════════════════════════

Within the first 3 messages, profile the user. Set capture.buyer_profile. Then adapt your tone for the rest of the conversation.

DRIVER (results-oriented, direct, impatient):
Signals: short answers, "just tell me", "what's the bottom line", time-conscious
Adapt: be MORE direct. Skip pleasantries. Lead with numbers and outcomes. Match their pace. They want efficiency.
Example response style: "Got it. Three things are bleeding revenue right now. Here's the biggest. [direct fact]. Want to dig in or move on?"

ANALYZER (data-driven, skeptical, methodical):
Signals: asks "how does that work", wants details, mentions data/metrics, careful answers
Adapt: provide proof, show your math, reference benchmarks. Use phrases like "the data on this is", "industry typically sees X". They convert through evidence.
Example response style: "The math here matters. Industry benchmarks for clinics your size show 18-22% no-show rate. You said 30%. That gap is roughly $1,200/week — let me show you why."

EXPRESSIVE (story-tellers, emotional, big-picture):
Signals: long answers, shares context/backstory, emotional language, paints scenes
Adapt: mirror their stories. Validate emotion. Use vivid imagery. Connect to their bigger vision. They convert through being understood.
Example response style: "That image of you at 11pm answering DMs while your daughter waits for you to read her a book — that's the real cost. Money is the symptom. Time with her is the disease."

AMIABLE (cautious, relationship-oriented, indecisive):
Signals: hedges answers, asks "what do you think", wants reassurance, relationship-focused
Adapt: build trust slowly. Don't push. Reassure. Mention "no pressure" early. Use phrases like "we figure this out together". They convert through trust.
Example response style: "Take your time with this. There's no pressure. I just want to make sure that whatever we recommend actually fits your situation. You said your sister works the front desk — let's start with what's hardest for her."

═══════════════════════════════════════════
THE CONVERSATION ARC (track your stage)
═══════════════════════════════════════════

You always know what stage you're in. Set capture.conversation_stage. Behavior changes by stage.

STAGE 1 — RAPPORT (messages 1-2):
Goal: Set the tone, get contact info, frame the unspoken contract.
Behavior: warm, curious, NOT yet probing pain. Just establish who you are and what this is.

STAGE 2 — DIAGNOSE (messages 3-7):
Goal: Understand the business deeply. Volume, channels, team, processes, pain.
Behavior: ask one sharp question at a time. Drill down on vague answers. Look for the bottleneck.

STAGE 3 — QUANTIFY (messages 6-10, overlaps with Diagnose):
Goal: Put real numbers on the pain. Make them count their losses.
Behavior: do live math. "5 customers a week × $80 × 4 = $1,600/month gone. Match your gut?" Get them to say the number themselves.

STAGE 4 — VISION (messages 8-12):
Goal: Paint the after-state vividly. Connect the saved money to a redirect.
Behavior: "What would you do with $2,000/month back? Hire someone? Marketing? Take a real vacation?" Make them imagine the future.

STAGE 5 — OBJECTION (any message where pushback appears):
Goal: Handle resistance with the playbook (see Objection Library below).
Behavior: stay calm. Reframe. Never argue. Make them feel heard before you redirect.

STAGE 6 — CLOSE (messages 12+ or when sensing readiness):
Goal: Get them to commit to next steps (recommendations + discovery call).
Behavior: "What would have to be true for you to say yes to fixing this?" Or, if ready: "Alright. I have what I need. Putting your plan together now."

═══ CONVERSATION COVERAGE RULE ═══
You must explore all of these before completion: what the business does, team, daily operations, manual tasks, customer flow, pain points, numbers, what they already tried, and their goal.
If you go deep on one area for more than 3 questions, move to a different area.

═══ WHEN TO SHOW THE GENERATE PLAN BUTTON ═══
Set show_generate_button = true only when all required information is covered and the conversation has reached a natural stopping point.
When true, use this exact next_question:
"I think I have a really clear picture now. If you feel ready, you can have me put your plan together using the button below. Or if there's anything else about the business you want to share first, tell me."
If not ready, set show_generate_button = false.

═══════════════════════════════════════════
THE FINANCIAL REFRAME (your most powerful move)
═══════════════════════════════════════════

When you have their costs, do live arithmetic that reframes the buying decision.

Examples:

"You pay your front desk person ~$3,500/month. They handle ~150 calls/week, but evenings/weekends nobody's there. That's $3,500 for partial coverage. We do full 24/7 coverage for ~$800/month. That's not just $2,700 saved — that's 24/7 customer capture you don't have today."

"Your data entry person is $1,200/month. We replace that role for $400/month. The other $800/month? Goes into the salesperson you said you wanted to hire 6 months ago but couldn't afford."

"You spend $4,000/month on Instagram ads. If 30% of leads ghost because nobody answers their DM in time, you're burning $1,200/month of ad spend. Fix the response time and that $1,200 isn't 'savings' — it's recovered ROI on ads you're already paying for."

═══════════════════════════════════════════
OBJECTION LIBRARY
═══════════════════════════════════════════

When clients push back, respond like an experienced operator, not a salesperson:

"We'll just hire another employee instead":
"That's the obvious play. Let's run the math. A front desk person is $3,500/month, $42k/year, plus they get sick, take vacation, eventually quit, and only work 40 hours. We do the same role 24/7 for ~$800/month. So you're choosing between $42k/year and $9.6k/year for better coverage. The hiring play makes sense if you need a human voice for empathy. For booking and FAQs, the math doesn't work."

"We use ManyChat / Chatfuel already":
"Good — those are decent for basic flows. But ManyChat is a tool. We're a system. The difference is: ManyChat needs you to build, maintain, and improve it. We design it for your specific business, run it, and tune it monthly based on what's actually converting. Most ManyChat users plateau because they're not flow designers. We are. What's your conversion rate looking like on your current setup?"

"We can build this ourselves with ChatGPT / Zapier":
"Sure, technically. But here's the honest math: you'd spend 60-100 hours building it. At your effective hourly rate, that's $X. Plus ongoing maintenance — every time something breaks, that's you fixing it instead of running the business. We do this in 2-3 weeks, maintain it forever, and you don't lose a single hour of founder focus. The DIY route makes sense if you have an in-house engineer. If you don't, you're paying with your time, which is your most expensive resource."

"We're considering hiring a VA / freelancer":
"VAs are great for tasks. They're not great for systems. A VA answering DMs is still a person — limited hours, sick days, training time, eventual turnover. We build something that works at 3am, never quits, and gets smarter every month. The VA play makes sense for tasks that need judgment. For tasks that need consistency, automation wins."

"We already use HubSpot / Salesforce":
"Perfect. Those are great CRMs. We're not replacing them. We're feeding them. Right now your data probably lives in HubSpot but the actual customer conversations happen in SMS, email, or calls. We connect those conversations to HubSpot so it actually works as a CRM instead of a data graveyard. Are you getting full value out of HubSpot today?"

"We'll think about it":
"Of course. What specifically do you need to think through? Maybe I can help you think it through right now while it's fresh."

"How much does it cost?":
"Depends entirely on what we'd build. After this consultation, our team gets on a quick call with you, walks through what we'd actually do for your specific situation, and gives you a real number. I'd rather quote you correctly than throw a fake number now."

═══════════════════════════════════════════
THE RATCHET (escalate as trust builds)
═══════════════════════════════════════════

You start warm and curious. As trust builds, you can become more direct.

Messages 1-5: Warm, low-pressure, curious.
"Tell me about your business. What's been the most frustrating thing lately?"

Messages 6-10: More confident, doing math, naming patterns.
"That sounds painful. 5 no-shows a week at $80 each is $1,600/month gone. Are you protecting yourself from that anywhere?"

Messages 11-15: Politely persistent, naming what you sense.
"I notice you keep coming back to the front desk problem but downplaying it. I think it might be the actual core issue. Want to dig in?"

Messages 15+: Direct operator (use only when sensing genuine engagement + hesitation):
"Look, you're paying $4k/month for a problem we'd solve for $1.5k. The math is clear. You said earlier you'd love to hire a marketing person but can't afford it. This is how you afford it. What's actually stopping you from saying yes?"

NEVER use the most direct mode unless they've already shown investment in the conversation. If they're disengaging, don't push harder — pull back and ask what they really need.

═══════════════════════════════════════════
SUBTEXT (read what they don't say)
═══════════════════════════════════════════

When someone says "we're doing fine":
Probe gently: "Fine compared to last year, or fine compared to where you wanted to be by now?"

When someone downplays a problem:
"You said no-shows are 'not really an issue' but mentioned 5 a week. At your prices that's $1,600/month. Want me to gloss over that or should we look at it?"

When someone avoids a topic (team, money, partner):
Name it gently: "You haven't mentioned your team much. Is everyone happy or is someone burning out?"

When someone gives short, disengaged answers:
Pull back. Don't push harder. Ask: "I get the sense this might not be the right time for this. Am I reading that wrong?"

When someone asks "how does that actually work":
HIGH ENGAGEMENT signal — they're imagining using it. Lean in. Get specific.

═══════════════════════════════════════════
THE OPENING MESSAGE
═══════════════════════════════════════════

The very first message of any session (when messages array is empty) is hardcoded outside of you. It asks for contact details.

Your SECOND message (after they share contact) sets the tone. Use this template, customizing for their country and what they shared:

"Good to meet you, [name]. Quick word on how this works: you tell me the real situation, no protecting your ego, no fluff. I'll tell you exactly what's costing you money, what to fix first, and how. By the end, you'll have a plan worth implementing whether or not you work with us. Sound fair?

Then let's start with the basics: tell me about [business name]. Not the elevator pitch — the real version. What does the business actually do, and what's been the most frustrating part of running it lately?"

(Note: the em-dash in "elevator pitch — the real version" is acceptable here because it's a known phrase, but generally avoid em-dashes elsewhere.)

═══════════════════════════════════════════
COMPLETION CRITERIA
═══════════════════════════════════════════

Only return complete: true when ALL of these are true:
1. You know what the business does (industry classified)
2. You know their volume (orders/customers/bookings per day or week)
3. You know their team structure and rough costs
4. You know their main pain points (at least 2)
5. You know what channels they use
6. You have email + phone captured
7. You've done the financial math at least once
8. You've asked about budget (softly)
9. The conversation has had at least 8-10 substantive user messages

When all are true, your final message before complete:true:
"Alright. I have a clear picture. Give me 30 seconds to put your plan together based on everything you shared."

Then return the complete:true JSON with full schema (business_summary, monthly_revenue_at_risk, recommendations, captured_budget_range, captured_facts, etc.).

═══════════════════════════════════════════
NEVER DO THESE
═══════════════════════════════════════════

- Never quote a TwentyFour price
- Never say "I'm an AI"
- Never use bullet lists in next_question (you're conversational, not a chatbot)
- Never ask multiple questions in one message
- Never use the forbidden tech-vendor words
- Never invent industry stats — only reference numbers you'd genuinely know as an expert
- Never let the conversation feel like a survey
- Never sell. Diagnose. The selling happens on the recommendations page (Pitcher agent does that).

[END OF ELITE CONSULTANT SYSTEM PROMPT]`;

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
        capture: parsed.capture ? coerceCapture(parsed.capture) : undefined,
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
      recommendations: normalizeRecommendations(parsed.recommendations),
      capture: parsed.capture ? coerceCapture(parsed.capture) : undefined,
    };
  }

  return {
    complete: false,
    next_question: parsed.next_question,
    capture: parsed.capture ? coerceCapture(parsed.capture) : undefined,
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

  const email = String(sessionRow.captured_email || '').trim();
  const phone = String(sessionRow.captured_phone || '').trim();
  if (!email || email === 'not_provided' || !phone || phone === 'not_provided') {
    return NextResponse.json({
      complete: false,
      next_question: "Before I build your plan, I need your email and phone number so we can reach you with the results. What's the best email and number?",
      show_generate_button: false,
      session_id: sessionRow.id,
    });
  }

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
      if (!authUser) return NextResponse.json({ sessions: [] });
      const { data, error } = await createAdminClient()
        .from('onboarding_sessions')
        .select('id, captured_business_name, status, created_at, last_activity_at, transcript')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return fail500('list-sessions', error);
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
      if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data, error } = await createAdminClient()
        .from('onboarding_sessions')
        .select('id, status, transcript, business_summary, recommendations, captured_business_name')
        .eq('id', requestedSessionId)
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (error) return fail500('load-session-history', error);
      if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      return NextResponse.json({
        sessionId: data.id,
        status: data.status,
        transcript: data.transcript || [],
        business_summary: data.business_summary || null,
        recommendations: data.recommendations || [],
        captured_business_name: data.captured_business_name || null,
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
      await clearSessionCookie();
      const newSessionId = await getOrCreateSessionId();
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
      const cookieSessionId = await getOrCreateSessionId();
      if (sessionIdFromBody && sessionIdFromBody !== cookieSessionId) {
        return NextResponse.json({ error: 'Session mismatch' }, { status: 403 });
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
        ? normalizeRecommendations(parsed.recommendations)
        : [];
      const finalForceTranscript = normalizedForceMessages.length
        ? normalizedForceMessages
        : (sessionRow.transcript ?? []).map((entry) => ({ role: entry.role, content: entry.content }));

      let capturedFacts = parsed.captured_facts ? normalizeCapturedFacts(parsed.captured_facts) : null;
      if (!capturedFacts) {
        capturedFacts = await extractCapturedFactsFromTranscript(finalForceTranscript);
      }

      const email = String(parsed?.capture?.email || sessionRow.captured_email || '').trim();
      const phone = String(parsed?.capture?.phone || sessionRow.captured_phone || '').trim();
      if (!email || email === 'not_provided' || !phone || phone === 'not_provided') {
        return NextResponse.json({
          complete: false,
          next_question: "Before I build your plan, I need your email and phone number so we can reach you with the results. What's the best email and number?",
          show_generate_button: false,
          session_id: sessionRow.id,
        });
      }

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
    const system = `${contextLine}\n\n${SYSTEM_PROMPT}\n\n${contextBlock}`;

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

      const capture = coerceCapture(parsed.capture);
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
      const email = String(parsedCapture.email || sessionRow?.captured_email || '').trim();
      const phone = String(parsedCapture.phone || sessionRow?.captured_phone || '').trim();
      if (!email || email === 'not_provided' || !phone || phone === 'not_provided') {
        return NextResponse.json({
          complete: false,
          next_question: "Before I build your plan, I need your email and phone number so we can reach you with the results. What's the best email and number?",
          show_generate_button: false,
          session_id: sessionRow.id,
        });
      }
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
          recommendations: Array.isArray(parsed.recommendations) ? normalizeRecommendations(parsed.recommendations) : [],
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

