// MSME Invisible Credit Score - Rule-Based Scoring Engine
// NO ML - Pure deterministic rules

import {
  MSMERecord,
  ScoreResult,
  TrustGrade,
  RiskLevel,
  LendingReadiness,
  SignalBreakdown,
  GstCompliance,
  UtilityPunctuality,
  UpiFrequency,
  DigitalPresence,
  LocationStability,
} from './types';

// Weights (must sum to 1.0)
const WEIGHTS = {
  gst_compliance: 0.25,
  utility_punctuality: 0.20,
  upi_frequency: 0.20,
  digital_presence: 0.15,
  business_age: 0.10,
  location_stability: 0.10,
};

// Normalization mappings (string → 0-1 score)
const GST_MAPPING: Record<GstCompliance, number> = {
  on_time: 1.0,
  occasionally_late: 0.6,
  frequently_late: 0.2,
};

const UTILITY_MAPPING: Record<UtilityPunctuality, number> = {
  on_time: 1.0,
  sometimes_late: 0.6,
  often_late: 0.2,
};

const UPI_MAPPING: Record<UpiFrequency, number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.2,
};

const DIGITAL_MAPPING: Record<DigitalPresence, number> = {
  strong: 1.0,
  basic: 0.6,
  none: 0.2,
};

const LOCATION_MAPPING: Record<LocationStability, number> = {
  stable: 1.0,
  changed_once: 0.6,
  unstable: 0.2,
};

// Business age normalization (years → 0-1)
function normalizeBusinessAge(establishedYear: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - establishedYear;
  
  if (age >= 10) return 1.0;
  if (age >= 7) return 0.9;
  if (age >= 5) return 0.8;
  if (age >= 3) return 0.6;
  if (age >= 2) return 0.4;
  return 0.2;
}

// Get impact type based on normalized score
function getImpact(normalizedScore: number): 'positive' | 'neutral' | 'negative' {
  if (normalizedScore >= 0.8) return 'positive';
  if (normalizedScore >= 0.5) return 'neutral';
  return 'negative';
}

// Human-readable signal names
const SIGNAL_NAMES: Record<string, string> = {
  gst_compliance: 'GST Compliance',
  utility_punctuality: 'Utility Bill Payment',
  upi_frequency: 'UPI Transaction Frequency',
  digital_presence: 'Digital Presence',
  business_age: 'Business Age',
  location_stability: 'Location Stability',
};

// Generate reason based on signal and value
function generateReason(signal: string, category: string, normalized: number): string {
  const reasons: Record<string, Record<string, string>> = {
    gst_compliance: {
      on_time: 'Consistent on-time GST filings demonstrate financial discipline',
      occasionally_late: 'Some late GST filings indicate room for improvement',
      frequently_late: 'Frequent late filings suggest compliance challenges',
    },
    utility_punctuality: {
      on_time: 'Regular utility payments show reliable cash flow management',
      sometimes_late: 'Occasional delays in utility payments noted',
      often_late: 'Frequent utility payment delays indicate cash flow issues',
    },
    upi_frequency: {
      high: 'High digital transaction volume indicates active business operations',
      medium: 'Moderate transaction activity shows steady business flow',
      low: 'Low transaction frequency may indicate limited business activity',
    },
    digital_presence: {
      strong: 'Strong online presence increases customer trust and visibility',
      basic: 'Basic digital presence, potential for growth',
      none: 'No digital presence limits market reach',
    },
    location_stability: {
      stable: 'Stable business location indicates operational consistency',
      changed_once: 'One location change noted, monitoring advised',
      unstable: 'Multiple location changes may indicate instability',
    },
  };

  if (signal === 'business_age') {
    const years = parseInt(category);
    if (years >= 7) return 'Well-established business with proven track record';
    if (years >= 4) return 'Established business with growing credibility';
    if (years >= 2) return 'Relatively new business, building history';
    return 'New business with limited operational history';
  }

  return reasons[signal]?.[category] || 'Signal evaluated';
}

// Calculate Trust Grade from score
function getTrustGrade(score: number): TrustGrade {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  return 'D';
}

// Calculate Risk Level from score
function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'Low';
  if (score >= 50) return 'Medium';
  return 'High';
}

// Calculate Lending Readiness from score
function getLendingReadiness(score: number): LendingReadiness {
  if (score >= 75) return 'Eligible';
  if (score >= 50) return 'Conditionally Eligible';
  return 'Not Ready';
}

// Get suggested loan range (mock text)
function getSuggestedLoanRange(score: number): string {
  if (score >= 85) return '₹10L - ₹50L (Unsecured)';
  if (score >= 75) return '₹5L - ₹25L (Unsecured)';
  if (score >= 60) return '₹2L - ₹10L (Partially Secured)';
  if (score >= 50) return '₹1L - ₹5L (Secured)';
  return 'Pre-qualification recommended';
}

// Generate improvement suggestions
function generateImprovements(record: MSMERecord, signals: SignalBreakdown[]): string[] {
  const improvements: string[] = [];

  if (record.gst_compliance !== 'on_time') {
    improvements.push('Maintain on-time GST filing for 3 consecutive months (+10 points)');
  }

  if (record.utility_punctuality !== 'on_time') {
    improvements.push('Clear pending utility bills and maintain punctual payments (+8 points)');
  }

  if (record.upi_frequency !== 'high') {
    improvements.push('Increase consistent UPI transaction activity (+6 points)');
  }

  if (record.digital_presence !== 'strong') {
    improvements.push('Establish Google Business Profile and social media presence (+5 points)');
  }

  if (record.location_stability !== 'stable') {
    improvements.push('Maintain stable business location for at least 12 months (+4 points)');
  }

  // Business age can't be improved, but we can note it
  const currentYear = new Date().getFullYear();
  const age = currentYear - record.established_year;
  if (age < 3) {
    improvements.push('Continue operations - business age naturally improves score over time');
  }

  // Always add a general suggestion
  if (improvements.length === 0) {
    improvements.push('Excellent profile! Maintain current operational standards.');
  }

  return improvements.slice(0, 5); // Max 5 suggestions
}

// Main scoring function
export function calculateScore(record: MSMERecord): ScoreResult {
  const currentYear = new Date().getFullYear();
  const businessAge = currentYear - record.established_year;

  // Calculate normalized values
  const normalizedGst = GST_MAPPING[record.gst_compliance];
  const normalizedUtility = UTILITY_MAPPING[record.utility_punctuality];
  const normalizedUpi = UPI_MAPPING[record.upi_frequency];
  const normalizedDigital = DIGITAL_MAPPING[record.digital_presence];
  const normalizedLocation = LOCATION_MAPPING[record.location_stability];
  const normalizedAge = normalizeBusinessAge(record.established_year);

  // Calculate weighted score
  const weightedScore =
    normalizedGst * WEIGHTS.gst_compliance +
    normalizedUtility * WEIGHTS.utility_punctuality +
    normalizedUpi * WEIGHTS.upi_frequency +
    normalizedDigital * WEIGHTS.digital_presence +
    normalizedAge * WEIGHTS.business_age +
    normalizedLocation * WEIGHTS.location_stability;

  const finalScore = Math.round(weightedScore * 100);

  // Build signal breakdown
  const signals: SignalBreakdown[] = [
    {
      signal: SIGNAL_NAMES.gst_compliance,
      category: record.gst_compliance.replace(/_/g, ' '),
      impact: getImpact(normalizedGst),
      score: Math.round(normalizedGst * WEIGHTS.gst_compliance * 100),
      reason: generateReason('gst_compliance', record.gst_compliance, normalizedGst),
    },
    {
      signal: SIGNAL_NAMES.utility_punctuality,
      category: record.utility_punctuality.replace(/_/g, ' '),
      impact: getImpact(normalizedUtility),
      score: Math.round(normalizedUtility * WEIGHTS.utility_punctuality * 100),
      reason: generateReason('utility_punctuality', record.utility_punctuality, normalizedUtility),
    },
    {
      signal: SIGNAL_NAMES.upi_frequency,
      category: record.upi_frequency,
      impact: getImpact(normalizedUpi),
      score: Math.round(normalizedUpi * WEIGHTS.upi_frequency * 100),
      reason: generateReason('upi_frequency', record.upi_frequency, normalizedUpi),
    },
    {
      signal: SIGNAL_NAMES.digital_presence,
      category: record.digital_presence,
      impact: getImpact(normalizedDigital),
      score: Math.round(normalizedDigital * WEIGHTS.digital_presence * 100),
      reason: generateReason('digital_presence', record.digital_presence, normalizedDigital),
    },
    {
      signal: SIGNAL_NAMES.business_age,
      category: `${businessAge} years`,
      impact: getImpact(normalizedAge),
      score: Math.round(normalizedAge * WEIGHTS.business_age * 100),
      reason: generateReason('business_age', businessAge.toString(), normalizedAge),
    },
    {
      signal: SIGNAL_NAMES.location_stability,
      category: record.location_stability.replace(/_/g, ' '),
      impact: getImpact(normalizedLocation),
      score: Math.round(normalizedLocation * WEIGHTS.location_stability * 100),
      reason: generateReason('location_stability', record.location_stability, normalizedLocation),
    },
  ];

  const trustGrade = getTrustGrade(finalScore);
  const riskLevel = getRiskLevel(finalScore);
  const lendingReadiness = getLendingReadiness(finalScore);
  const improvements = generateImprovements(record, signals);
  const suggestedLoanRange = getSuggestedLoanRange(finalScore);

  // Re-evaluation period based on score
  const reEvaluationDays = finalScore < 50 ? 30 : 90;

  return {
    score: finalScore,
    trustGrade,
    riskLevel,
    lendingReadiness,
    signals,
    improvements,
    suggestedLoanRange,
    reEvaluationDays,
  };
}

// Format "DD Mon YYYY" date string to relative time
export function getRelativeTime(dateStr: string): string {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const parts = dateStr.split(' ');
  if (parts.length !== 3) return dateStr;

  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]);

  if (isNaN(day) || month === undefined || isNaN(year)) return dateStr;

  const date = new Date(year, month, day);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Get current date in "DD Mon YYYY" format
export function getCurrentDateString(): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}
