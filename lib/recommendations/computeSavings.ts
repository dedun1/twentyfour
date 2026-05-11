import type { CapturedFacts } from '@/lib/agents/types';

/** Raw recommendation row as stored on the session (before UI normalization). */
export type RawRecommendationLike = {
  time_saved_hours_per_month?: number;
  hours_saved?: number;
  timeSaved?: number;
};

export type SavingsMethod = 'real_team_cost' | 'industry_blend';

export type SavingsBreakdown = {
  monthlyHoursSaved: number;
  hourlyRateUsed: number;
  monthlyDollarsSaved: number;
  annualDollarsSaved: number;
  method: SavingsMethod;
  methodLabel: string;
  isReliable: boolean;
};

const FULL_TIME_HOURS_PER_MONTH = 173;

// Industry rates are calibrated 20% below typical-market so the discovery
// call always over-delivers vs page promise. "other" is set to produce a
// conservative $15/hr floor for any business with no detected industry.
const INDUSTRY_RATES: Record<string, { admin: number; operator: number }> = {
  dental_clinic: { admin: 30, operator: 58 },
  medical_clinic: { admin: 32, operator: 62 },
  restaurant: { admin: 22, operator: 40 },
  ecommerce: { admin: 28, operator: 52 },
  real_estate: { admin: 26, operator: 48 },
  beauty_salon: { admin: 24, operator: 42 },
  service_business: { admin: 26, operator: 46 },
  other: { admin: 14, operator: 19 },
};

function blendHourly(admin: number, operator: number): number {
  return Math.round(admin * 0.8 + operator * 0.2);
}

export function monthlyHoursFromRawRecs(raw: RawRecommendationLike[] | null | undefined): number {
  if (!raw?.length) return 0;
  return raw.reduce((sum, rec) => {
    const h = Number(rec.time_saved_hours_per_month ?? rec.hours_saved ?? rec.timeSaved ?? 0);
    if (!Number.isFinite(h) || h <= 0) return sum;
    return sum + Math.round(h);
  }, 0);
}

function industryHourly(detectedIndustry: string | null | undefined): number {
  const key = (detectedIndustry || '').trim() || 'other';
  const row = INDUSTRY_RATES[key] ?? INDUSTRY_RATES.other;
  return blendHourly(row.admin, row.operator);
}

/**
 * Hourly value and dollar savings from captured facts + recommendation hour totals.
 * Does not use strategist monthly_cost_of_inaction or ROI string parsing.
 */
export function computeSavings(
  capturedFacts: CapturedFacts | null | undefined,
  rawRecommendations: RawRecommendationLike[] | null | undefined,
  detectedIndustry?: string | null,
): SavingsBreakdown {
  const monthlyHoursSaved = monthlyHoursFromRawRecs(rawRecommendations);

  const teamCost = capturedFacts?.monthly_team_cost;
  const teamSize = capturedFacts?.team_size;

  const hasRealTeamCost =
    teamCost != null &&
    Number.isFinite(teamCost) &&
    teamCost > 0 &&
    teamSize != null &&
    Number.isFinite(teamSize) &&
    teamSize > 0;

  let method: SavingsMethod;
  let hourlyRateUsed: number;
  let methodLabel: string;

  // Minimum defensible US labor rate. Below this we're modeling
  // offshore/contractor cost arbitrage, not US labor value.
  const TIER_A_MIN_HOURLY = 15;

  if (hasRealTeamCost) {
    const tierAHourly = teamCost! / teamSize! / FULL_TIME_HOURS_PER_MONTH;
    if (tierAHourly >= TIER_A_MIN_HOURLY) {
      method = 'real_team_cost';
      hourlyRateUsed = tierAHourly;
      methodLabel = 'From your stated monthly team cost and headcount';
    } else {
      // Tier A produced an absurd rate (likely offshore contractors
      // or freelance cost structure). Fall through to industry blend.
      method = 'industry_blend';
      hourlyRateUsed = industryHourly(detectedIndustry ?? null);
      methodLabel =
        'Conservative industry hourly blend (your stated team cost was below US labor rates)';
    }
  } else {
    method = 'industry_blend';
    hourlyRateUsed = industryHourly(detectedIndustry ?? null);
    methodLabel = 'Conservative industry hourly blend (80% admin, 20% operator)';
  }

  const hourlyRounded = Math.max(0, Math.round(hourlyRateUsed));
  const monthlyDollarsSaved = Math.round(monthlyHoursSaved * hourlyRounded);
  const annualDollarsSaved = monthlyDollarsSaved * 12;

  const isReliable =
    monthlyHoursSaved > 0 &&
    hourlyRounded > 0 &&
    Number.isFinite(monthlyDollarsSaved) &&
    monthlyDollarsSaved > 0;

  return {
    monthlyHoursSaved,
    hourlyRateUsed: hourlyRounded,
    monthlyDollarsSaved,
    annualDollarsSaved,
    method,
    methodLabel,
    isReliable,
  };
}

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 hours/month';
  const rounded = Math.round(hours);
  return `${rounded} hours/month`;
}
