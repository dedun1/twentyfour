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
      "needs_clarification": true | false
    }
  ],
  "total_hours_saved": <sum of time_saved_hours_per_month>,
  "total_monthly_value": <total_hours_saved * 10>
}

Output ONLY raw JSON. No markdown.`;

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
  };
}

function toRecommenderOutput(input: unknown): RecommenderOutput {
  const value = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  const recs = Array.isArray(value.recommendations)
    ? value.recommendations.map((r, i) => parseRecommendation(r, i)).slice(0, 6)
    : [];

  const recommendations = recs.length > 0 ? recs : [parseRecommendation({}, 0)];
  const computedHours = recommendations.reduce((sum, rec) => sum + rec.time_saved_hours_per_month, 0);
  const total_hours_saved = Math.max(1, Math.round(Number(value.total_hours_saved ?? computedHours) || computedHours));
  const total_monthly_value = Math.max(
    1,
    Math.round(Number(value.total_monthly_value ?? total_hours_saved * 10) || total_hours_saved * 10)
  );

  return {
    recommendations,
    total_hours_saved,
    total_monthly_value,
  };
}

export async function runRecommender(
  consultant: ConsultantOutput,
  strategist: StrategistOutput,
  businessData: unknown
): Promise<RecommenderOutput> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 4000,
      system: RECOMMENDER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Business analysis request:\n${JSON.stringify(businessData, null, 2)}\n\nConsultation:\n${JSON.stringify(consultant, null, 2)}\n\nStrategic analysis:\n${JSON.stringify(strategist, null, 2)}`,
        },
      ],
    });

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
    const parsed = toRecommenderOutput(JSON.parse(cleaned));
    console.log('[Recommender] Success. Keys:', Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error('[Recommender] FAILED:', (error as Error)?.message || error);
    return toRecommenderOutput({});
  }
}
