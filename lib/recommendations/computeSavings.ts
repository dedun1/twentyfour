import type { CapturedFacts, Recommendation } from '@/lib/agents/types';

const OPERATOR_BLEND_RATIO = 0.2;
const ADMIN_BLEND_RATIO = 0.8;
const STANDARD_WORKING_HOURS_PER_MONTH = 160;
const MAX_REASONABLE_RATIO = 0.5;
const MIN_REASONABLE_USD = 200;

type IndustryKey =
  | 'dental_clinic'
  | 'medical_clinic'
  | 'restaurant'
  | 'ecommerce'
  | 'real_estate'
  | 'beauty_salon'
  | 'service_business'
  | 'other';

const INDUSTRY_RATES_USD: Record<IndustryKey, { operator: number; admin: number }> = {
  dental_clinic: { operator: 60, admin: 24 },
  medical_clinic: { operator: 72, admin: 26 },
  restaurant: { operator: 28, admin: 18 },
  ecommerce: { operator: 36, admin: 20 },
  real_estate: { operator: 64, admin: 24 },
  beauty_salon: { operator: 36, admin: 20 },
  service_business: { operator: 44, admin: 22 },
  other: { operator: 40, admin: 20 },
};

export type SavingsCalculationMethod = 'real_team_cost' | 'industry_benchmark' | 'conservative_default';

export type SavingsBreakdown = {
  monthlyHoursSaved: number;
  monthlyDollarsSaved: number;
  annualDollarsSaved: number;
  hourlyRateUsed: number;
  method: SavingsCalculationMethod;
  methodLabel: string;
  isReliable: boolean;
};

function blendedRateFromIndustry(industry: string | null | undefined): { rate: number; label: string } {
  const key = (industry && industry in INDUSTRY_RATES_USD ? industry : 'other') as IndustryKey;
  const { operator, admin } = INDUSTRY_RATES_USD[key];
  const blended = Math.round(operator * OPERATOR_BLEND_RATIO + admin * ADMIN_BLEND_RATIO);
  const friendly = key === 'service_business' ? 'service-business' : key.replace('_', ' ');
  return {
    rate: blended,
    label: `Based on industry-typical ${friendly} operator rates`,
  };
}

function realTeamHourlyRate(facts: CapturedFacts | null | undefined): number | null {
  if (!facts) return null;
  const cost = typeof facts.monthly_team_cost === 'number' && facts.monthly_team_cost > 0 ? facts.monthly_team_cost : null;
  const size = typeof facts.team_size === 'number' && facts.team_size > 0 ? facts.team_size : null;
  if (!cost || !size) return null;
  const hourly = cost / size / STANDARD_WORKING_HOURS_PER_MONTH;
  if (!Number.isFinite(hourly) || hourly < 5 || hourly > 500) return null;
  return Math.round(hourly);
}

export function computeSavings(
  recommendations: Recommendation[] | null | undefined,
  capturedFacts: CapturedFacts | null | undefined,
  detectedIndustry: string | null | undefined
): SavingsBreakdown {
  const recs = Array.isArray(recommendations) ? recommendations : [];
  const monthlyHoursSaved = recs.reduce((sum, rec) => {
    const hours = typeof rec?.time_saved_hours_per_month === 'number' ? rec.time_saved_hours_per_month : 0;
    return sum + (Number.isFinite(hours) && hours > 0 ? hours : 0);
  }, 0);

  let hourlyRate: number;
  let method: SavingsCalculationMethod;
  let methodLabel: string;

  const realRate = realTeamHourlyRate(capturedFacts);
  if (realRate !== null) {
    hourlyRate = realRate;
    method = 'real_team_cost';
    methodLabel = `Based on your team's actual hourly cost ($${realRate}/hr)`;
  } else if (detectedIndustry) {
    const industryResult = blendedRateFromIndustry(detectedIndustry);
    hourlyRate = industryResult.rate;
    method = 'industry_benchmark';
    methodLabel = industryResult.label;
  } else {
    hourlyRate = 20;
    method = 'conservative_default';
    methodLabel = 'Based on conservative industry benchmarks';
  }

  const rawMonthly = Math.round(monthlyHoursSaved * hourlyRate);

  const revenue = typeof capturedFacts?.monthly_revenue === 'number' && capturedFacts.monthly_revenue > 0 ? capturedFacts.monthly_revenue : null;
  const cap = revenue ? Math.round(revenue * MAX_REASONABLE_RATIO) : null;
  const cappedMonthly = cap ? Math.min(rawMonthly, cap) : rawMonthly;

  const isReliable = cappedMonthly >= MIN_REASONABLE_USD && monthlyHoursSaved > 0;

  return {
    monthlyHoursSaved: Math.round(monthlyHoursSaved),
    monthlyDollarsSaved: cappedMonthly,
    annualDollarsSaved: cappedMonthly * 12,
    hourlyRateUsed: hourlyRate,
    method,
    methodLabel,
    isReliable,
  };
}

export function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

export function formatHours(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} hrs`;
}
