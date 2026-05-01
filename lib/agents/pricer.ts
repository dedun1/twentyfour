import Anthropic from '@anthropic-ai/sdk';
import type { ConsultantOutput, PricerOutput, RecommenderOutput } from './types';

const OPUS_MODEL = 'claude-haiku-4-5-20251001';

const PRICER_SYSTEM_PROMPT = `═══ CRITICAL FORMATTING RULE ═══
You MUST NOT use em-dashes (—) or en-dashes (–) anywhere in your output. Use periods, commas, or colons instead.

You will receive a businessData object with captured_facts. Use ONLY the numbers in captured_facts for any calculations. If a field is null, say "to be confirmed on discovery call" instead of inventing a number. Reference the transcript for qualitative context.

You are TwentyFour's project pricer. You estimate internal effort and suggest quote ranges based on the recommendations and the client's signaled budget. This output is INTERNAL ONLY. It goes to the founder, not the client.

Pricing reference:
- Simple automation (single channel auto-reply, basic reminders): 5-15 build hours, quote $400-900
- Medium automation (multi-channel, booking system, dashboards): 20-40 hours, quote $1,200-2,500
- Complex/custom (custom AI agents, integrations, custom workflows): 50-120 hours, quote $3,000-8,000+

Total project cost is the sum of all recommendations' build effort.

Output JSON:
{
  "total_build_complexity": "simple" | "medium" | "complex",
  "estimated_build_hours": <total hours across all recommendations>,
  "suggested_quote_range_usd": { "min": <number>, "max": <number> },
  "recommended_tier": "Starter $99/mo + setup $X" | "Pro $299/mo + setup $X" | "Custom from $999/mo + setup $X",
  "budget_fit": "matches" | "stretch" | "below_budget" | "unknown",
  "pricing_strategy_note": "2-3 sentences advising the founder how to handle the quote on the discovery call. Mention budget alignment, lead-with-ROI tactics, or whether to upsell/downsell."
}

Output ONLY raw JSON. No markdown.`;

function toPricerOutput(input: unknown): PricerOutput {
  const value = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  const complexity =
    value.total_build_complexity === 'simple' ||
    value.total_build_complexity === 'medium' ||
    value.total_build_complexity === 'complex'
      ? value.total_build_complexity
      : 'medium';
  const budget_fit =
    value.budget_fit === 'matches' ||
    value.budget_fit === 'stretch' ||
    value.budget_fit === 'below_budget' ||
    value.budget_fit === 'unknown'
      ? value.budget_fit
      : 'unknown';

  const quoteObj = typeof value.suggested_quote_range_usd === 'object' && value.suggested_quote_range_usd
    ? (value.suggested_quote_range_usd as Record<string, unknown>)
    : {};

  const min = Math.max(100, Math.round(Number(quoteObj.min ?? 1200) || 1200));
  const max = Math.max(min, Math.round(Number(quoteObj.max ?? 2500) || 2500));

  return {
    total_build_complexity: complexity,
    estimated_build_hours: Math.max(1, Math.round(Number(value.estimated_build_hours ?? 24) || 24)),
    suggested_quote_range_usd: { min, max },
    recommended_tier: String(value.recommended_tier ?? 'Pro $299/mo + setup $1200').trim(),
    budget_fit,
    pricing_strategy_note: String(value.pricing_strategy_note ?? 'Lead with ROI and anchor the quote against monthly revenue leakage to improve close rate.').trim(),
  };
}

export async function runPricer(
  recommender: RecommenderOutput,
  consultant: ConsultantOutput,
  businessData: unknown
): Promise<PricerOutput> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 1000,
      system: PRICER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Business data:\n${JSON.stringify(businessData, null, 2)}\n\nRecommendations:\n${JSON.stringify(recommender, null, 2)}\n\nClient budget signal: ${consultant.raw_data.budget_range || 'not_sure'}`,
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
    const parsed = toPricerOutput(JSON.parse(cleaned));
    console.log('[Pricer] Success. Keys:', Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error('[Pricer] FAILED:', (error as Error)?.message || error);
    return toPricerOutput({});
  }
}
