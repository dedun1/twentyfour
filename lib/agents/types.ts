export type TranscriptMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type BudgetRange = 'under_300' | '300_to_1000' | '1000_plus' | 'not_sure';
export type DataQuality = 'high' | 'medium' | 'low';

export type CapturedFacts = {
  monthly_revenue: number | null;
  daily_orders: number | null;
  average_order_value: number | null;
  team_size: number | null;
  cost_per_acquisition?: number | null;
  monthly_team_cost: number | null;
  monthly_tool_spend: number | null;
  monthly_ad_spend: number | null;
  hours_lost_per_week?: number | null;
  response_time: string | null;
  no_show_rate: string | null;
  pain_points: string[];
  manual_processes: string[];
  current_tools?: string[];
  product_or_service?: string | null;
  customer_type?: string | null;
  acquisition_channel?: string | null;
  retention_strategy?: string | null;
};

export type ConsultantOutput = {
  business_summary: string;
  contact: {
    name?: string;
    email?: string;
    phone?: string;
    business_name?: string;
  };
  raw_data: {
    what_they_do?: string;
    volume?: string;
    team_size?: string;
    channels?: string[];
    pain_points?: string[];
    current_processes?: string;
    goals?: string;
    budget_range?: BudgetRange;
  };
  captured_facts?: CapturedFacts;
  transcript: TranscriptMessage[];
};

export type StrategistOutput = {
  core_bottleneck: string;
  root_causes: string[];
  highest_leverage_move: string;
  monthly_cost_of_inaction: number;
  risks_if_no_action: string[];
  growth_blockers: string[];
  what_winning_looks_like: string;
  strategic_summary: string;
};

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
    unit: 'time' | 'percentage' | 'hours' | 'count';
  };
  priority: 'high' | 'medium' | 'low';
  channel: string;
  custom_build: boolean;
  data_quality?: DataQuality;
  needs_clarification?: boolean;
};

export type RecommenderOutput = {
  recommendations: Recommendation[];
  total_hours_saved: number;
  total_monthly_value: number;
};

export type PricerOutput = {
  total_build_complexity: 'simple' | 'medium' | 'complex';
  estimated_build_hours: number;
  suggested_quote_range_usd: { min: number; max: number };
  recommended_tier: string;
  budget_fit: 'matches' | 'stretch' | 'below_budget' | 'unknown';
  pricing_strategy_note: string;
};

export type PitcherOutput = {
  hero_headline: string;
  hero_subline: string;
  cost_of_inaction_headline: string;
  transformation_promise: string;
  cta_main: string;
  cta_secondary: string;
  closing_emotional_line: string;
};

export type PipelineResult = {
  consultant: ConsultantOutput;
  strategist: StrategistOutput;
  recommender: RecommenderOutput;
  pricer: PricerOutput;
  pitcher: PitcherOutput;
};
