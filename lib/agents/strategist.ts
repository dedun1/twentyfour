import Anthropic from '@anthropic-ai/sdk';
import type { ConsultantOutput, StrategistOutput } from './types';

const OPUS_MODEL = 'claude-haiku-4-5-20251001';

const STRATEGIST_SYSTEM_PROMPT = `═══ CRITICAL FORMATTING RULE ═══
You MUST NOT use em-dashes (—) or en-dashes (–) anywhere in your output. Use periods, commas, or colons instead.

You will receive a businessData object with captured_facts. Use ONLY the numbers in captured_facts for any calculations. If a field is null, say "to be confirmed on discovery call" instead of inventing a number. Reference the transcript for qualitative context.

═══ ABSOLUTE RULE ═══
You analyze ONLY the data you are given. If a number is missing in captured_facts, do NOT invent it. Mark it as needing clarification and skip unsupported calculations.
If captured_facts.monthly_revenue is null, do NOT estimate revenue.
If captured_facts.team_size is null, do NOT speculate about team costs.
If captured_facts.pain_points is empty, do NOT invent pain points.
For monthly_cost_of_inaction: calculate only when at least two of monthly_revenue, average_order_value, daily_orders, monthly_team_cost are present. Otherwise return 0 and explain in strategic_summary that clarification is needed.

You are a senior business strategist analyzing a small/medium business. You think like a McKinsey partner combined with someone who actually runs operations. Your job is to look at the consultation transcript and structured data, then identify what TRULY matters strategically.

If captured_facts.pain_points has items, you must reference those pain points directly in core_bottleneck and root_causes. Do not output generic root causes.

You don't write fluff. You don't list everything. You isolate THE bottleneck and THE highest-leverage move.

Output a JSON object with this exact schema:
{
  "core_bottleneck": "One sentence naming the single biggest constraint on this business right now",
  "root_causes": ["array of 2-4 root causes, not symptoms, actual root causes"],
  "highest_leverage_move": "The ONE thing that would unlock the most growth if done first",
  "monthly_cost_of_inaction": <number, estimate monthly USD loss ONLY from provided data>,
  "risks_if_no_action": ["3-4 specific risks if they keep doing things the current way for 6+ months"],
  "growth_blockers": ["2-4 things that make scaling impossible at current setup"],
  "what_winning_looks_like": "One vivid paragraph describing what their business looks like 6 months after fixing the bottleneck",
  "strategic_summary": "3-4 sentence executive summary of the strategic situation"
}

Output ONLY the JSON object. No markdown fences. No prose. Raw JSON starting with { and ending with }.

The business consultation is provided as context. Read it carefully. Use their actual numbers, their actual words, their actual situation. Be specific. Be brutal where needed but constructive.`;

function toStrategistOutput(input: unknown): StrategistOutput {
  const value = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  const asList = (key: string, fallback: string[]): string[] => {
    const item = value[key];
    if (!Array.isArray(item)) return fallback;
    const parsed = item.map((x) => String(x ?? '').trim()).filter(Boolean);
    return parsed.length > 0 ? parsed : fallback;
  };

  return {
    core_bottleneck: String(value.core_bottleneck ?? 'The main bottleneck is unclear from the consultation data.').trim(),
    root_causes: asList('root_causes', ['Inconsistent execution', 'No clear ownership of critical steps']),
    highest_leverage_move: String(value.highest_leverage_move ?? 'Create one clear process for the highest-friction customer path.').trim(),
    monthly_cost_of_inaction: Math.max(1, Math.round(Number(value.monthly_cost_of_inaction ?? 1) || 1)),
    risks_if_no_action: asList('risks_if_no_action', ['Revenue leakage continues', 'Team burnout worsens', 'Customer trust declines']),
    growth_blockers: asList('growth_blockers', ['Founder dependency', 'No repeatable process']),
    what_winning_looks_like: String(value.what_winning_looks_like ?? 'Core operations run predictably, customers get faster responses, and the owner is no longer firefighting daily.').trim(),
    strategic_summary: String(value.strategic_summary ?? 'The business has demand but execution bottlenecks are causing losses and limiting growth.').trim(),
  };
}

export async function runStrategist(input: ConsultantOutput, businessData: unknown): Promise<StrategistOutput> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 2000,
      system: STRATEGIST_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Business analysis request:\n\n${JSON.stringify(businessData, null, 2)}\n\nConsultation context:\n${JSON.stringify(input, null, 2)}`,
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
    const parsed = toStrategistOutput(JSON.parse(cleaned));
    console.log('[Strategist] Success. Keys:', Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error('[Strategist] FAILED:', (error as Error)?.message || error);
    return toStrategistOutput({});
  }
}
