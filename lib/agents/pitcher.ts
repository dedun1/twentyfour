import Anthropic from '@anthropic-ai/sdk';
import type {
  ConsultantOutput,
  PitcherOutput,
  RecommenderOutput,
  StrategistOutput,
} from './types';

const OPUS_MODEL = 'claude-haiku-4-5-20251001';

const PITCHER_SYSTEM_PROMPT = `═══ CRITICAL FORMATTING RULE ═══
You MUST NOT use em-dashes (—) or en-dashes (–) anywhere in your output. Use periods, commas, or colons instead.

You will receive a businessData object with captured_facts. Use ONLY the numbers in captured_facts for any calculations. If a field is null, say "to be confirmed on discovery call" instead of inventing a number. Reference the transcript for qualitative context.

═══ DATA GROUNDING RULE ═══
Use facts from captured_facts wherever available. Do not invent numbers. If facts are sparse, use emotional but truthful language without fabricated metrics.

You are a world-class direct response copywriter. You write the personalized sales copy that appears on the recommendations page. The client just had a deep consultation. Now they see this page. Your copy must hit them emotionally and make them want to book the discovery call.

Use:
- Their name (if captured)
- Their business name (if captured)
- Their actual pain in their words
- The strategist's "what winning looks like" framing
- The cost of inaction in dollars

NEVER use: "automate", "AI", "workflow", "leverage", "synergy", "optimize", "streamline", "solution", "platform", "best-in-class", or any corporate-speak.

Use words like: "stop losing", "get back", "fix this", "money walking out", "your evenings", "your team's mood", "what you actually wanted when you started this business".

Output JSON:
{
  "hero_headline": "Big personal headline. Use their name or business if captured. e.g., 'Ahmed, here's what's actually eating your week'",
  "hero_subline": "1-2 sentences acknowledging their specific situation",
  "cost_of_inaction_headline": "Punchy line above the red savings bar. e.g., 'Every month you wait, $2,400 walks out the door'",
  "transformation_promise": "1-2 sentences for above the green savings bar. The vivid future state.",
  "cta_main": "Action button text that feels earned. Example: 'Get my evenings back. Book the call'",
  "cta_secondary": "Soft CTA. e.g., 'I have questions first'",
  "closing_emotional_line": "One line at the very bottom that lands. e.g., 'You started this business for the freedom. Let's get it back.'"
}

Output ONLY raw JSON. No markdown.`;

function toPitcherOutput(input: unknown): PitcherOutput {
  const value = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  return {
    hero_headline: String(value.hero_headline ?? "Here's what's costing you each week").trim(),
    hero_subline: String(value.hero_subline ?? 'We mapped your consultation into a concrete plan built around your actual bottlenecks.').trim(),
    cost_of_inaction_headline: String(value.cost_of_inaction_headline ?? 'Every month you wait, more money walks out the door').trim(),
    transformation_promise: String(value.transformation_promise ?? 'Fix the bottlenecks now so your days run cleaner, your team breathes easier, and revenue stops leaking.').trim(),
    cta_main: String(value.cta_main ?? 'Book the call and fix this').trim(),
    cta_secondary: String(value.cta_secondary ?? 'I have questions first').trim(),
    closing_emotional_line: String(value.closing_emotional_line ?? "You started this business for freedom. Let's help you get it back.").trim(),
  };
}

export async function runPitcher(
  consultant: ConsultantOutput,
  strategist: StrategistOutput,
  recommender: RecommenderOutput,
  businessData: unknown
): Promise<PitcherOutput> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: OPUS_MODEL,
      max_tokens: 1500,
      system: PITCHER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            `Business analysis request:\n${JSON.stringify(businessData, null, 2)}` +
            `\n\nConsultation:\n${JSON.stringify(consultant, null, 2)}` +
            `\n\nStrategic insights:\n${JSON.stringify(strategist, null, 2)}` +
            `\n\nRecommendations:\n${JSON.stringify(recommender, null, 2)}`,
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
    const parsed = toPitcherOutput(JSON.parse(cleaned));
    console.log('[Pitcher] Success. Keys:', Object.keys(parsed));
    return parsed;
  } catch (error) {
    console.error('[Pitcher] FAILED:', (error as Error)?.message || error);
    return toPitcherOutput({});
  }
}
