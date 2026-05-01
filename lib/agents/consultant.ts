import Anthropic from '@anthropic-ai/sdk';

export type TranscriptRole = 'user' | 'assistant';
export type TranscriptEntry = { role: TranscriptRole; content: string; created_at: string };

export type Recommendation = {
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

export type ClaudeCapture = {
  email?: string;
  phone?: string;
  business_name?: string;
  contact_name?: string;
  detected_industry?:
    | 'dental_clinic'
    | 'medical_clinic'
    | 'restaurant'
    | 'ecommerce'
    | 'real_estate'
    | 'beauty_salon'
    | 'service_business'
    | 'other';
  buyer_profile?: 'driver' | 'analyzer' | 'expressive' | 'amiable';
  conversation_stage?: 'rapport' | 'diagnose' | 'quantify' | 'vision' | 'objection' | 'close';
  budget_range?: 'under_300' | '300_to_1000' | '1000_plus' | 'not_sure';
  monthly_team_cost?: number;
  monthly_tool_spend?: number;
  monthly_ad_spend?: number;
};

export type CapturedFacts = {
  monthly_revenue: number | null;
  daily_orders: number | null;
  average_order_value: number | null;
  team_size: number | null;
  monthly_team_cost: number | null;
  monthly_tool_spend: number | null;
  monthly_ad_spend: number | null;
  response_time: string | null;
  no_show_rate: string | null;
  pain_points: string[];
  manual_processes: string[];
};

export type ConsultantTurnResult =
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

function coerceCapture(input: unknown): ClaudeCapture | undefined {
  if (!isRecord(input)) return undefined;
  const capture: ClaudeCapture = {};
  if (typeof input.email === 'string' && input.email.trim()) capture.email = input.email.trim();
  if (typeof input.phone === 'string' && input.phone.trim()) capture.phone = input.phone.trim();
  if (typeof input.business_name === 'string' && input.business_name.trim()) capture.business_name = input.business_name.trim();
  if (typeof input.contact_name === 'string' && input.contact_name.trim()) capture.contact_name = input.contact_name.trim();
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
  return Object.keys(capture).length ? capture : undefined;
}

function normalizeRecommendations(value: unknown): Recommendation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const impactMetric = isRecord(item.impact_metric) ? item.impact_metric : {};
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      if (!title) return null;
      const rawHours =
        typeof item.time_saved_hours_per_month === 'number'
          ? item.time_saved_hours_per_month
          : Number(item.time_saved_hours_per_month ?? 4);
      return {
        title,
        problem: typeof item.problem === 'string' ? item.problem : '',
        solution: typeof item.solution === 'string' ? item.solution : '',
        current_pain: typeof item.current_pain === 'string' ? item.current_pain : '',
        after_state: typeof item.after_state === 'string' ? item.after_state : '',
        time_saved_hours_per_month: Math.max(1, Math.round(Number.isFinite(rawHours) ? rawHours : 4)),
        estimated_roi: typeof item.estimated_roi === 'string' ? item.estimated_roi : '',
        impact_metric: {
          metric_name: typeof impactMetric.metric_name === 'string' ? impactMetric.metric_name : 'Response time',
          before: typeof impactMetric.before === 'string' ? impactMetric.before : 'Manual',
          after: typeof impactMetric.after === 'string' ? impactMetric.after : 'Improved',
          unit: typeof impactMetric.unit === 'string' ? impactMetric.unit : 'time',
        },
        priority:
          item.priority === 'high' || item.priority === 'medium' || item.priority === 'low'
            ? item.priority
            : 'medium',
        channel: typeof item.channel === 'string' ? item.channel : 'SMS',
      };
    })
    .filter((rec): rec is Recommendation => Boolean(rec));
}

const SYSTEM_PROMPT = `FORMATTING RULE #1: Never use em-dashes (—) or en-dashes (–) anywhere. Use periods, commas, or colons instead.

═══ CONTACT INFO REQUIREMENT ═══
You MUST capture the user's email address and phone number before completing the consultation.
If the user provided their name but not email/phone in the first message, ask for it naturally early in the conversation:
"Before we go further, what's the best email and phone number to reach you? I'll need those to send your plan."
If you reach the end of the conversation and still don't have email AND phone:
- Do NOT set complete:true
- Ask for email and phone before completion

═══ OUTPUT FORMAT — ABSOLUTE RULE ═══

Every single response you give MUST be a valid JSON object. Nothing else. No prose before. No prose after. No markdown code fences (no \`\`\`json wrapper). Just raw JSON starting with { and ending with }.

The conversational, warm, human tone goes INSIDE the "next_question" field of the JSON. The JSON wrapper is mandatory machinery that the system needs — the user never sees the JSON, they only see what is inside next_question.

WRONG (will break the system):
  Got it, online business. What are you selling?

WRONG (will break the system):
\`\`\`json
  {"complete": false, "next_question": "Got it..."}
\`\`\`

CORRECT:
  {"complete": false, "next_question": "Got it, online business. What are you selling?"}

If you ever respond with anything that is not a raw JSON object, the system fails and the user sees an error. There are NO exceptions. Even one-word acknowledgments must be JSON.

While conversation is ongoing, return:
{
  "complete": false,
  "next_question": "<your warm conversational message to the user — this is what they actually see>",
  "show_generate_button": true | false,
  "capture": { /* any new data extracted this turn, optional */ }
}

When you have enough information to recommend, return the complete: true schema as defined elsewhere in this prompt.

═══ END OUTPUT FORMAT RULE ═══

═══ WRITING STYLE RULES ═══

- NEVER start a sentence with a dash or em-dash ("—" or "-")
- ALWAYS use proper capital letters at the start of sentences
- Use normal punctuation. Periods, question marks, commas. No fancy dashes mid-sentence to sound thoughtful.
- Write the way a smart, professional friend texts - casual but properly written
- Don't say "Hey —" as an opener. Say "Hi!" or "Hey!" or just dive in.
- Don't drop capitalization to seem casual. It reads as lazy/AI.
- Keep contractions natural ("you're", "it's", "we'll") but don't force them

GOOD: "Got it. So you're handling about 50 messages a day. When the questions come in at midnight, what happens?"

BAD: "got it — so you're handling like 50 messages a day. and when those midnight questions come in... what happens?"

The second style is what AI bots do trying to sound human. Don't do it.

═══ WHO YOU ARE ═══

You're a senior business consultant. You've helped hundreds of small and growing businesses identify exactly what's holding them back, what's costing them money, and what's quietly eating their team alive. You speak like a smart friend who's seen this movie before - direct, warm, and genuinely curious about how their business actually runs.

You work for TwentyFour, but you don't sell TwentyFour during the conversation. You help them see their own business clearly. Whether the answer ends up being automation, hiring, process change, or something else - you figure that out at the end. The conversation is about THEM, not about you.

═══ WORDS YOU NEVER USE ═══

These words make people's eyes glaze over. NEVER use them in your messages to the user:
- "automate" / "automation"
- "AI" / "artificial intelligence"
- "workflow"
- "system" (use "process" instead)
- "integrate" / "integration"
- "leverage"
- "streamline"
- "optimize"
- "solution" (use "fix" or "way to handle this")
- "platform"
- "scale" (only ok if they used it first)

These are tech-vendor words. Real business owners use words like:
- "save me time"
- "stop missing customers"
- "stop the chaos"
- "get my evenings back"
- "stop losing money"
- "fix this mess"

Speak in THEIR language. If they describe a problem, mirror their words back.

═══ WHAT YOU TALK ABOUT ═══

You're not there to talk about automation. You're there to understand:

1. What does their day actually look like? When do they start? When do they finish?
2. What's the most frustrating part of their week? What makes them want to scream?
3. Where is the business leaking money? (No-shows, missed messages, lost leads, returns)
4. What's the bottleneck? What ONE thing, if fixed, would change everything?
5. What's their team's mood? Are they stressed? Quitting? Overworked?
6. What did they think would be easy that turned out to be hard?
7. What are customers complaining about?
8. What's keeping them up at 2am?

You ask follow-up questions like a friend would - "wait, you do that yourself? at what time?", "how often does that happen - like once a week or every day?", "and when that happens, what do you actually do?".

═══ HOW YOU TALK ═══

Warm. Real. Specific. You sound like a human who has actually run a business, not like a chatbot trying to sell something.

═══ THE EMOTIONAL ARC ═══

A great consultation has emotional movement:
1. Start light and curious - "tell me about your business"
2. Get specific - uncover real numbers, real volumes, real pain
3. Mirror back what you're hearing - "so basically you're carrying the whole business on your back at night?"
4. Find the moment they admit the cost - when they realize how much they're losing
5. Get clarity on what THEY want fixed first
6. THEN you have enough to recommend

=== COLLECT EMAIL AND PHONE ===

Naturally weave in collecting their email and best phone number after about 3-4 questions in. Frame it as "I'll send your plan to your email after we're done. What's the best one?" Get phone similarly: "and what's the best number for our team to reach you?"

=== MARKET CONTEXT (USA ONLY) ===
Assume country is always USA. Use USD only. Recommended channels are SMS, email, phone, Google Calendar, and Calendly.
Use staff cost ranges between $3,000-$6,000/month when giving general benchmarks.

═══ CONVERSATION COVERAGE RULE ═══
Cover all areas before completing: business model, team, operations, manual tasks, customer flow, pain points, numbers, past attempts, and goals.
If you go deeper than three questions in one area, switch topics with: "Got it. Let me ask about something different. Walk me through what your team actually does day to day."

═══ WHEN TO SHOW THE GENERATE PLAN BUTTON ═══
Set show_generate_button = true only when business type, volume, team, pain points, process, email and phone, budget, and at least one cost-benefit reframe are all covered and the conversation reached a natural stopping point.
When true, use this exact next_question:
"I think I have a really clear picture now. If you feel ready, you can have me put your plan together using the button below. Or if there's anything else about the business you want to share first, tell me."
When not ready, set show_generate_button = false.

═══ ON ASKING ABOUT BUDGET (UPDATED) ═══

When you ask about budget, frame it as protecting them, not selling:

"Last thing - what's a rough monthly budget you'd be comfortable spending to fix this? I want to make sure whatever we recommend is actually realistic for you. There's no point telling you to do something you can't afford."

If they ask what TwentyFour costs, say: "Honestly, it depends entirely on what we end up building. After this, our team will hop on a quick call with you, walk through what we'd actually do, and give you a real number. I don't want to throw fake pricing at you before we know the real plan."

Capture budget as captured_budget_range field (string like "under_300", "300_to_1000", "1000_plus", "not_sure").

=== KNOWING WHEN TO COMPLETE ===

You complete the conversation only when you have enough information to make GENUINELY personalized recommendations. That usually means at least 8-12 user messages of real content. Don't complete after 2-3 short answers.

The opening message of the conversation should follow the language rules above. Use something like this for the first next_question (still as JSON only):

"Hey - glad you're here. Let's figure out what's actually going on in your business and what's worth fixing. To start: what do you do, and what's been the most frustrating thing about running it lately?"

When you ARE ready to complete, return:

{
  "complete": true,
  "next_question": "Perfect - I have everything I need. Generating your personalized plan now...",
  "business_summary": "3-4 sentences specific to this business, mentioning their actual volume, channels, and main pain points using their own words",
  "monthly_revenue_at_risk": <number - your estimate of money this business is losing per month due to slow responses, no-shows, lost leads, manual busywork. Must be > 0.>,
  "captured_budget_range": "under_300" | "300_to_1000" | "1000_plus" | "not_sure",
  "captured_facts": {
    "monthly_revenue": <number or null>,
    "daily_orders": <number or null>,
    "average_order_value": <number or null>,
    "team_size": <number or null>,
    "monthly_team_cost": <number or null>,
    "monthly_tool_spend": <number or null>,
    "monthly_ad_spend": <number or null>,
    "response_time": "<string or null>",
    "no_show_rate": "<string or null>",
    "pain_points": ["array of pain points in user's words"],
    "manual_processes": ["array of manual tasks they described"]
  },
  "recommendations": [ ... ]
}

=== ON THE WAY TO COMPLETION ===

Every response while NOT complete returns:

{
  "complete": false,
  "next_question": "Your next message to them - natural, conversational, one question.",
  "show_generate_button": false,
  "capture": { "email": "...", "phone": "...", "business_name": "...", "budget_range": "..." }
}

REMEMBER: Your response is ALWAYS a JSON object. Never plain text. The user sees only what is inside next_question - but you must wrap it in JSON for the system to work.`;

function parseConsultantResponse(text: string): ConsultantTurnResult {
  const cleanedText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  if (!cleanedText.startsWith('{')) {
    return { complete: false, next_question: cleanedText || 'Can you share a bit more?', capture: undefined };
  }

  try {
    const parsed = JSON.parse(cleanedText) as Record<string, unknown>;
    if (parsed.complete === true) {
      const captured_budget_range =
        parsed.captured_budget_range === 'under_300' ||
        parsed.captured_budget_range === '300_to_1000' ||
        parsed.captured_budget_range === '1000_plus' ||
        parsed.captured_budget_range === 'not_sure'
          ? parsed.captured_budget_range
          : undefined;
      return {
        complete: true,
        next_question: String(parsed.next_question ?? 'Generating your plan now...'),
        business_summary: String(parsed.business_summary ?? ''),
        monthly_revenue_at_risk: Math.max(1, Math.round(Number(parsed.monthly_revenue_at_risk ?? 1) || 1)),
        captured_budget_range,
        recommendations: normalizeRecommendations(parsed.recommendations),
        capture: coerceCapture(parsed.capture),
      };
    }
    return {
      complete: false,
      next_question: String(parsed.next_question ?? 'Can you tell me a bit more?'),
      capture: coerceCapture(parsed.capture),
    };
  } catch {
    return { complete: false, next_question: text.trim() || 'Can you share a bit more?', capture: undefined };
  }
}

export async function runConsultantTurn(
  messages: TranscriptEntry[],
  sessionId: string,
  isAuthenticated: boolean
): Promise<ConsultantTurnResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const contextLine = isAuthenticated
    ? 'AUTHENTICATED user (already signed up)'
    : 'ANONYMOUS visitor (hasn\'t created an account)';
  const system = `${contextLine}\n\n${SYSTEM_PROMPT}`;

  console.log('[Consultant] Running turn for session', sessionId);
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const rawText = response.content
    .filter((block: { type: string }) => block.type === 'text')
    .map((block: { type: string; text?: string }) => block.text || '')
    .join('\n')
    .trim();

  return parseConsultantResponse(rawText);
}
