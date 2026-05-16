// MSME Data Types - Strict typing for CSV data

export type GstCompliance = 'on_time' | 'occasionally_late' | 'frequently_late';
export type UtilityPunctuality = 'on_time' | 'sometimes_late' | 'often_late';
export type UpiFrequency = 'low' | 'medium' | 'high';
export type DigitalPresence = 'none' | 'basic' | 'strong';
export type LocationStability = 'stable' | 'changed_once' | 'unstable';

export interface MSMERecord {
  gstin: string;
  business_name: string;
  established_year: number;
  gst_compliance: GstCompliance;
  utility_punctuality: UtilityPunctuality;
  upi_frequency: UpiFrequency;
  digital_presence: DigitalPresence;
  location_stability: LocationStability;
  avg_monthly_balance: number;
  bounce_rate_percent: number;
  itr_filed_last_year: boolean;
  bureau_vintage_months: number;
  monthly_revenue_trend: 'growing' | 'stable' | 'declining';
  last_updated: string;
}

export type TrustGrade = 'A' | 'B' | 'C' | 'D';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type LendingReadiness = 'Eligible' | 'Conditionally Eligible' | 'Not Ready';

export interface SignalBreakdown {
  signal: string;
  category: string;
  impact: 'positive' | 'neutral' | 'negative';
  score: number;
  reason: string;
}

export interface ScoreResult {
  score: number;
  trustGrade: TrustGrade;
  riskLevel: RiskLevel;
  lendingReadiness: LendingReadiness;
  signals: SignalBreakdown[];
  improvements: string[];
  suggestedLoanRange: string;
  reEvaluationDays: number;
}
