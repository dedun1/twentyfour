import Anthropic from '@anthropic-ai/sdk';
import type {
  ConsultantOutput,
  Recommendation,
  RecommenderOutput,
  StrategistOutput,
} from './types';

const OPUS_MODEL = 'claude-haiku-4-5-20251001';

const RECOMMENDER_SYSTEM_PROMPT = `You are TwentyFour's senior solution architect. You receive the strategic analysis of a business and translate it into specific, buildable automation recommendations.

═══ CRITICAL FORMATTING RULE ═══
You MUST NOT use em-dashes (—) or en-dashes (–) anywhere in your output. Use periods, commas, or colons instead.

You will receive a businessData object with captured_facts. Use ONLY the numbers in captured_facts for any calculations. If a field is null, say "to be confirmed on discovery call" instead of inventing a number. Reference the transcript for qualitative context.

═══ DATA GROUNDING RULE ═══
Every recommendation MUST tie to a specific captured_facts pain_point or manual_process.
For time_saved_hours_per_month and estimated_roi, use only captured numbers. If numbers are missing, set needs_clarification to true and explain that exact impact is confirmed on discovery call.
Never invent dollar figures.

==== ANTI-FABRICATION RULE ====

When you write current_pain, estimated_roi, or impact_metric.before, you may ONLY cite numbers the user explicitly mentioned in captured_facts. If captured_facts does not contain a relevant number for a given recommendation:

ALLOWED: estimate from industry benchmarks, but you MUST:
1. Hedge the language. Use "typically", "similar operators see", "industry average is roughly", or "in our experience with HVAC operators of this size".
2. Set needs_clarification: true on that recommendation.
3. In the data_quality field, set "low" if your numbers are entirely benchmark-based, "medium" if you have at least one user-stated metric, "high" only if all numbers come from user-stated facts.
4. Include a "discovery_call_clarifies" field listing the specific data point(s) that would tighten the estimate. Example: "exact missed-call count per week" or "current no-show rate".

NOT ALLOWED:
- Stating concrete missed-call counts when user said "sometimes we miss calls" without a number.
- Citing specific dollar figures of revenue loss when user did not state revenue OR you noticed a revenue contradiction.
- Quantifying hours saved when hours_lost_per_week is null.

If the user mentioned a pain point but provided no quantification AND no industry benchmark exists for that scenario, write the estimated_roi as: "Specific dollar impact to be calculated on discovery call. Based on the pain you described, we'd expect [hedged qualitative range]."

==== END BLOCK ====

═══ BUILDABLE-VS-ADVISORY RULE ═══

Every recommendation MUST be something TwentyFour builds, deploys, and maintains as a running system, workflow, or automation. The test is simple: does it run on its own after we set it up, or does the client have to manually do something themselves?

VALID (runs on its own after setup):
- AI chat bot that auto-replies to client messages 24/7
- Automated booking reminders via SMS
- Google review request sent automatically after service completion
- Dashboard that pulls live metrics from their platforms
- Escalation routing system that triages messages and routes to the right person
- Cart abandonment email/SMS sequence
- After-hours auto-responder trained on their FAQs
- CRM integration that syncs leads automatically
- Any system, bot, integration, or automated workflow that runs without human intervention

NOT VALID as standalone recommendations (the client does the work, not our system):
- "Assign a team member to handle messages" (hiring/management advice)
- "Create a decision matrix" (consulting deliverable)
- "Update your profile FAQ section" (client does it manually)
- "Train your team on escalation" (training advice)
- "Optimize your pricing structure" (business strategy)

If the best fix for a pain point is partially advisory, wrap the advice INSIDE a buildable recommendation. Example: instead of a standalone "Assign someone to reply" card, build "AI Intake Bot with Human Escalation" where the bot handles 80% automatically and routes the 20% that need judgment to a team member. The system is the recommendation. The advice about who handles escalation is a detail inside the solution field.

NEVER generate a standalone recommendation card for something the client does themselves. If you catch yourself writing a solution that starts with "Assign...", "Create a document...", "Train your team...", "Update your profile..." — stop and reframe it as a system TwentyFour builds.

═══ NO OVERLAPPING RECOMMENDATIONS ═══

If two potential recommendations address the same core problem (e.g., both solve "slow response time"), MERGE them into one recommendation. One pain point = one card = one solution.

Example of what NOT to do:
- Card 1: "Message Handler with Templates" (assign human to reply faster)
- Card 2: "AI Customer Intake Bot" (bot replies automatically)
Both solve slow replies. WRONG to have two cards.

Correct: ONE card called "AI-Powered Client Response System" that combines the bot (handles 80% automatically) with the escalation flow (routes complex questions to a team member). One problem, one solution, one card.

When merging, keep the higher-impact framing. The time_saved_hours_per_month should reflect the COMBINED savings, not double-counted.

TwentyFour can build ANYTHING that's technically possible. You are NOT limited to a fixed catalog. Common things we build:
- SMS/Email/Instagram automation (replies, booking, follow-up, broadcasts)
- AI customer support trained on the business's FAQs and tone
- Booking and appointment systems with reminders
- Daily/weekly automated reports to owner
- CRM and lead management automations
- Order processing pipelines (Shopify, Instagram Shop, etc.)
- Internal team workflows (Slack notifications, task auto-assignment)
- Custom AI agents trained on specific business knowledge
- Integrations between any tools (CRM ↔ accounting ↔ inventory)
- Voice AI for call handling
- Document generation, data entry automation
- Custom dashboards
- Anything else they need, if it's technically possible, propose it

Output 3-6 recommendations in priority order (highest impact first). Use their actual numbers. Generate ONLY recommendations that directly address the strategist's identified bottleneck and root causes.

Each recommendation MUST include data_quality (required): "high" means all quantified numbers in current_pain, estimated_roi, and impact_metric.before trace to user-stated captured_facts; "medium" means at least one user-stated metric plus hedged benchmark language; "low" means quantification is primarily benchmark-based or the user gave no usable numbers. Each recommendation MUST include discovery_call_clarifies as a string array (use [] when nothing needs confirmation on the call).

Output JSON schema:
{
  "recommendations": [
    {
      "title": "Short specific name (max 6 words)",
      "problem": "20+ words. Their actual pain in their words. NEVER 'manual process taking time.'",
      "solution": "20+ words. Plain English fix. NO 'automate'/'AI'/'workflow' tech-vendor words. Speak like a person.",
      "current_pain": "One vivid sentence with their numbers. Example: 'You're losing 5 customers a week to delayed responses. That is $1,500/month walking out.'",
      "after_state": "One vivid sentence. e.g., 'You wake up to a clean inbox. Customers got real answers overnight.'",
      "time_saved_hours_per_month": <number based on their volume>,
      "estimated_roi": "Grounded impact in USD, or 'Specific dollar impact to be calculated on discovery call'",
      "impact_metric": {
        "metric_name": "Specific metric name",
        "before": "Their current state in their numbers",
        "after": "The new state",
        "unit": "time" | "percentage" | "hours" | "count"
      },
      "priority": "high" | "medium" | "low",
      "channel": "SMS" | "Email" | "Instagram" | "Dashboard" | "Voice" | "Custom" | etc,
      "custom_build": true | false,
      "data_quality": "high" | "medium" | "low",
      "needs_clarification": true | false,
      "discovery_call_clarifies": ["<strings: data points to confirm on discovery call, e.g. exact missed-call count per week>"]
    }
  ],
  "total_hours_saved": <sum of time_saved_hours_per_month>,
  "total_monthly_value": <total_hours_saved * 10>
}

Output ONLY raw JSON. No markdown.`;

/**
 * Returns all dollar figures found in a string, parsed as numbers (no comma, no $).
 * Matches patterns like "$1,680", "$50000", "$2,800+", "$300/day", "$1.5k", "1500 USD".
 */
function extractDollarFiguresFromText(text: string): number[] {
  if (!text || typeof text !== 'string') return [];
  const figures: number[] = [];
  // Match $X or $X,XXX or $X.X with optional k/K suffix
  const dollarPattern = /\$?\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*([kKmM])?/g;
  let match: RegExpExecArray | null;
  while ((match = dollarPattern.exec(text)) !== null) {
    const rawNum = match[1].replace(/,/g, '');
    const value = Number.parseFloat(rawNum);
    if (!Number.isFinite(value) || value < 10) continue; // Skip tiny numbers (likely not dollar amounts)
    const suffix = (match[2] || '').toLowerCase();
    const multiplier = suffix === 'k' ? 1000 : suffix === 'm' ? 1_000_000 : 1;
    figures.push(value * multiplier);
  }
  return figures;
}

/**
 * Checks whether a dollar figure is "grounded" in captured_facts. A figure is grounded if:
 * - It directly matches any captured number (within 5% tolerance)
 * - It's derivable from a single multiplication of two captured numbers (daily_orders * AOV, etc.)
 * - It's derivable from a percentage of one number (e.g. 40% of monthly_revenue)
 * - It's within 5% of revenue * common-monthly-multiplier (24, 30 for monthly recurring; 12 for annual)
 */
function isFigureGrounded(figure: number, facts: Record<string, unknown> | null | undefined): boolean {
  if (!facts) return false;
  const tolerance = 0.05; // 5% tolerance for rounding
  const isClose = (a: number, b: number) => {
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return false;
    return Math.abs(a - b) / b <= tolerance;
  };

  // Collect all positive numeric values from captured_facts
  const numbers: number[] = [];
  for (const key of [
    'monthly_revenue',
    'daily_orders',
    'average_order_value',
    'team_size',
    'monthly_team_cost',
    'monthly_tool_spend',
    'monthly_ad_spend',
    'hours_lost_per_week',
    'cost_per_acquisition',
  ]) {
    const v = facts[key];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) numbers.push(v);
  }

  if (numbers.length === 0) return false;

  // Direct match
  for (const n of numbers) {
    if (isClose(figure, n)) return true;
  }

  // Single-multiplier derivations: 0.05 to 1.0 (percentages), 12 (annual), 24 (24-hour), 30 (monthly)
  const multipliers = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 4, 7, 12, 20, 22, 24, 26, 30];
  for (const n of numbers) {
    for (const m of multipliers) {
      if (isClose(figure, n * m)) return true;
    }
  }

  // Pairwise product (e.g. daily_orders * average_order_value, then * any multiplier)
  for (let i = 0; i < numbers.length; i++) {
    for (let j = 0; j < numbers.length; j++) {
      if (i === j) continue;
      const product = numbers[i] * numbers[j];
      if (isClose(figure, product)) return true;
      for (const m of multipliers) {
        if (isClose(figure, product * m)) return true;
      }
    }
  }

  return false;
}

/**
 * Scans every dollar figure across recommendations and verifies it can be derived
 * from captured_facts. Returns details on the first ungrounded figure encountered.
 */
function detectUngroundedDollarFigures(
  recs: Recommendation[],
  capturedFacts: Record<string, unknown> | null | undefined,
): { hasUngrounded: boolean; reason: string } {
  if (!capturedFacts) {
    // If we have no captured_facts, we can't validate. Skip the check rather than reject.
    return { hasUngrounded: false, reason: 'No captured_facts to validate against (skipped)' };
  }

  // Count how many positive numeric fields are available for cross-referencing.
  // If too few, the check produces false positives because most derived figures
  // can't be traced back. Minimum 4 numeric facts required for meaningful validation.
  const NUMERIC_KEYS = [
    'monthly_revenue',
    'daily_orders',
    'average_order_value',
    'team_size',
    'monthly_team_cost',
    'monthly_tool_spend',
    'monthly_ad_spend',
    'hours_lost_per_week',
    'cost_per_acquisition',
  ];
  const numericCount = NUMERIC_KEYS.filter((key) => {
    const v = capturedFacts[key];
    return typeof v === 'number' && Number.isFinite(v) && v > 0;
  }).length;

  if (numericCount < 4) {
    console.warn(
      `[Recommender] Skipping dollar grounding check: only ${numericCount} numeric facts available (minimum 4 required). Fields present:`,
      NUMERIC_KEYS.filter((key) => {
        const v = capturedFacts[key];
        return typeof v === 'number' && Number.isFinite(v) && v > 0;
      }),
    );
    return { hasUngrounded: false, reason: `Only ${numericCount} numeric facts (minimum 4 required), skipped` };
  }

  for (const rec of recs) {
    const fieldsToCheck: Array<{ name: string; text: string }> = [
      { name: 'current_pain', text: rec.current_pain || '' },
      { name: 'estimated_roi', text: rec.estimated_roi || '' },
      { name: 'impact_metric.before', text: rec.impact_metric?.before || '' },
      { name: 'impact_metric.after', text: rec.impact_metric?.after || '' },
    ];

    for (const { name, text } of fieldsToCheck) {
      const figures = extractDollarFiguresFromText(text);
      for (const figure of figures) {
        if (!isFigureGrounded(figure, capturedFacts)) {
          return {
            hasUngrounded: true,
            reason: `Ungrounded dollar figure $${figure.toLocaleString()} in rec "${rec.title}" field "${name}". Not derivable from captured_facts.`,
          };
        }
      }
    }
  }

  return { hasUngrounded: false, reason: '' };
}

function detectDegenerateOutput(recs: Recommendation[]): { isDegenerate: boolean; reason: string } {
  if (!Array.isArray(recs)) {
    return { isDegenerate: true, reason: 'Output is not an array' };
  }
  if (recs.length < 2) {
    return { isDegenerate: true, reason: `Only ${recs.length} recommendation(s) returned (expected 3-6)` };
  }
  for (const rec of recs) {
    if (!rec.title || /^Recommendation\s*\d*$/i.test(rec.title.trim())) {
      return { isDegenerate: true, reason: `Generic title detected: "${rec.title}"` };
    }
    if (rec.problem && rec.problem.length < 50) {
      return { isDegenerate: true, reason: `Problem statement too short (${rec.problem.length} chars)` };
    }
    if (rec.problem && /current setup is causing avoidable delays/i.test(rec.problem)) {
      return { isDegenerate: true, reason: 'Boilerplate problem text detected' };
    }
  }
  return { isDegenerate: false, reason: '' };
}

function parseRecommendation(input: unknown, index: number): Recommendation {
  const value = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  const unitRaw = String((value.impact_metric as any)?.unit ?? 'time');
  const unit = unitRaw === 'percentage' || unitRaw === 'hours' || unitRaw === 'count' ? unitRaw : 'time';

  return {
    title: String(value.title ?? `Recommendation ${index + 1}`).trim(),
    problem: String(value.problem ?? 'The current setup is causing avoidable delays and missed revenue opportunities.').trim(),
    solution: String(value.solution ?? 'We put in place a practical fix that reduces response delays and removes repetitive bottlenecks.').trim(),
    current_pain: String(value.current_pain ?? 'The team is losing hours each week and revenue is leaking due to slow follow-up.').trim(),
    after_state: String(value.after_state ?? 'Daily operations run predictably and customers get timely answers without constant firefighting.').trim(),
    time_saved_hours_per_month: Math.max(1, Math.round(Number(value.time_saved_hours_per_month ?? 4) || 4)),
    estimated_roi: String(value.estimated_roi ?? 'Specific dollar impact to be calculated on discovery call').trim(),
    impact_metric: {
      metric_name: String((value.impact_metric as any)?.metric_name ?? 'Response time').trim(),
      before: String((value.impact_metric as any)?.before ?? 'Manual').trim(),
      after: String((value.impact_metric as any)?.after ?? 'Faster').trim(),
      unit,
    },
    priority:
      value.priority === 'high' || value.priority === 'medium' || value.priority === 'low'
        ? value.priority
        : 'medium',
    channel: String(value.channel ?? 'Custom').trim(),
    custom_build: Boolean(value.custom_build),
    data_quality:
      value.data_quality === 'high' || value.data_quality === 'medium' || value.data_quality === 'low'
        ? value.data_quality
        : 'low',
    needs_clarification: Boolean(value.needs_clarification),
    discovery_call_clarifies: Array.isArray(value.discovery_call_clarifies)
      ? (value.discovery_call_clarifies as unknown[])
          .map((x) => String(x).trim())
          .filter((s) => s.length > 0)
      : [],
  };
}

/** Parses recommender JSON without inserting a degenerate single fallback row. */
function buildRecommenderOutputFromParsed(
  value: Record<string, unknown>,
  opts?: { attempt?: number; rawText?: string; capturedFacts?: Record<string, unknown> | null }
): RecommenderOutput {
  const rawRecs = Array.isArray(value.recommendations) ? value.recommendations : [];
  if (rawRecs.length === 0) {
    throw new Error('Recommender JSON has no recommendations array or it is empty');
  }
  const recs = rawRecs.map((r, i) => parseRecommendation(r, i)).slice(0, 6);
  const degenerateCheck = detectDegenerateOutput(recs);
  if (degenerateCheck.isDegenerate) {
    console.error('[Recommender] DEGENERATE OUTPUT DETECTED:', degenerateCheck.reason);
    console.error('[Recommender] Raw input that produced this:', opts?.rawText?.slice(0, 2000));
    const suffix = opts?.attempt != null ? ` (attempt ${opts.attempt})` : '';
    throw new Error(`Recommender produced degenerate output${suffix}: ${degenerateCheck.reason}`);
  }

  // Anti-fabrication: every dollar figure in every rec must be grounded in captured_facts.
  const groundedCheck = detectUngroundedDollarFigures(recs, opts?.capturedFacts ?? null);
  if (groundedCheck.hasUngrounded) {
    console.error('[Recommender] UNGROUNDED DOLLAR FIGURE DETECTED:', groundedCheck.reason);
    console.error('[Recommender] Raw input that produced this:', opts?.rawText?.slice(0, 2000));
    const suffix = opts?.attempt != null ? ` (attempt ${opts.attempt})` : '';
    throw new Error(`Recommender produced ungrounded figures${suffix}: ${groundedCheck.reason}`);
  }

  const computedHours = recs.reduce((sum, rec) => sum + rec.time_saved_hours_per_month, 0);
  const total_hours_saved = Math.max(1, Math.round(Number(value.total_hours_saved ?? computedHours) || computedHours));
  const total_monthly_value = Math.max(
    1,
    Math.round(Number(value.total_monthly_value ?? total_hours_saved * 10) || total_hours_saved * 10)
  );
  return {
    recommendations: recs,
    total_hours_saved,
    total_monthly_value,
  };
}

export async function runRecommender(
  consultant: ConsultantOutput,
  strategist: StrategistOutput,
  businessData: unknown
): Promise<RecommenderOutput> {
  const MAX_ATTEMPTS = 2;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const userContent = `Business analysis request:\n${JSON.stringify(businessData, null, 2)}\n\nConsultation:\n${JSON.stringify(consultant, null, 2)}\n\nStrategic analysis:\n${JSON.stringify(strategist, null, 2)}`;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[Recommender] Attempt ${attempt}/${MAX_ATTEMPTS}`);
      const response = await anthropic.messages.create({
        model: OPUS_MODEL,
        max_tokens: 4000,
        system: RECOMMENDER_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      });

      console.log('[Recommender] Raw API response keys:', Object.keys(response as object));
      console.log('[Recommender] Raw stop_reason:', (response as { stop_reason?: string }).stop_reason);
      console.log('[Recommender] Raw usage:', JSON.stringify((response as { usage?: unknown }).usage));
      const firstText = response.content?.find?.((c: { type: string }) => c.type === 'text') as
        | { type: string; text?: string }
        | undefined;
      console.log('[Recommender] First text block (first 1500 chars):', firstText?.text?.slice(0, 1500));

      const rawText = response.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { type: string; text?: string }) => block.text || '')
        .join('\n')
        .trim();

      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const jsonParsed = JSON.parse(cleaned) as Record<string, unknown>;
      const businessDataRecord = typeof businessData === 'object' && businessData !== null
        ? (businessData as Record<string, unknown>)
        : {};
      const capturedFactsForCheck =
        typeof businessDataRecord.captured_facts === 'object' && businessDataRecord.captured_facts !== null
          ? (businessDataRecord.captured_facts as Record<string, unknown>)
          : null;
      const out = buildRecommenderOutputFromParsed(jsonParsed, {
        attempt,
        rawText: cleaned,
        capturedFacts: capturedFactsForCheck,
      });
      console.log(`[Recommender] Success on attempt ${attempt} with ${out.recommendations.length} recommendations`);
      return out;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[Recommender] Attempt ${attempt} failed:`, lastError.message);
      if (attempt < MAX_ATTEMPTS) {
        console.log('[Recommender] Retrying...');
      }
    }
  }
  throw new Error(`Recommender failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
}
