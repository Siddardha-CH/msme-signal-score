// Results Dashboard - MSME Credit Score Display
// Cards, tables, badges - NO charts or graphs

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ArrowLeft,
  Building2,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lightbulb,
  FileText,
  Edit,
} from 'lucide-react';
import { useMSMEStore } from '@/hooks/use-msme-store';
import { calculateScore, getRelativeTime } from '@/lib/scoring-engine';
import { ScoreResult, MSMERecord } from '@/lib/types';
import { fetchMLScore, MLScoreResult } from '@/lib/api';
import { motion } from 'framer-motion';

// Animated number counter
const AnimatedNumber = ({ value, duration = 1500 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + (value - startValue) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { gstin } = useParams<{ gstin: string }>();
  const { findSync, isLoading, records } = useMSMEStore();
  const [record, setRecord] = useState<MSMERecord | null>(null);
  const [mlData, setMlData] = useState<MLScoreResult | null>(null);
  const [isLoadingMl, setIsLoadingMl] = useState(true);

  // Directly fetch from backend API - no cache dependency
  useEffect(() => {
    if (!gstin) return;
    setIsLoadingMl(true);
    
    // Fetch MSME record directly
    import('@/lib/api').then(({ fetchMSME }) => {
      fetchMSME(gstin)
        .then(data => {
          setRecord(data);
          // Then fetch ML score
          return fetchMLScore(gstin);
        })
        .then(data => setMlData(data))
        .catch(err => console.error("Error loading dashboard data:", err))
        .finally(() => setIsLoadingMl(false));
    });
  }, [gstin]);

  const scoreResult: ScoreResult | null = useMemo(() => {
    if (!record) return null;
    
    // Calculate the base breakdown for display purposes
    const baseCalculated = calculateScore(record);
    
    // Inject the real ML prediction if we have it
    if (mlData) {
        return {
            ...baseCalculated,
            score: mlData.predicted_score
        };
    }
    
    return baseCalculated;
  }, [record, mlData]);

  if (isLoading || isLoadingMl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!record || !scoreResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">MSME Not Found</h1>
          <p className="text-muted-foreground mb-6">No record found for GSTIN: {gstin}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'High':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getReadinessIcon = (readiness: string) => {
    switch (readiness) {
      case 'Eligible':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Conditionally Eligible':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'Eligible':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Conditionally Eligible':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getTrustGradeClass = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'trust-grade-a';
      case 'B':
        return 'trust-grade-b';
      case 'C':
        return 'trust-grade-c';
      default:
        return 'trust-grade-d';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-300 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-white">Credit Score AI</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/msme/edit/${gstin}`)} className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
            <Edit className="w-4 h-4 mr-2" />
            Update Profile
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card 1: MSME Summary */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Building2 className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-muted-foreground">Business Summary</h3>
                <p className="text-xl font-semibold text-foreground mt-1">{record.business_name}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">GSTIN</span>
                <span className="text-sm font-mono font-medium text-foreground">{record.gstin}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Established</span>
                <span className="text-sm font-medium text-foreground">{record.established_year}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last Updated
                </span>
                <span className="text-sm font-medium text-foreground">{getRelativeTime(record.last_updated)}</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: AI Credit Score */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/10 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-muted-foreground">AI Predicted Credit Score</h3>
                    <Badge variant="secondary" className="bg-primary/20 text-primary uppercase text-[10px] tabular-nums tracking-widest hidden sm:flex">
                        Scikit-Learn ML
                    </Badge>
                </div>
                <div className={`text-5xl font-bold mt-2 ${getScoreColor(scoreResult.score)}`}>
                  <AnimatedNumber value={scoreResult.score} />
                  <span className="text-lg font-normal text-muted-foreground">/100</span>
                </div>
              </div>
              <div className={`trust-grade ${getTrustGradeClass(scoreResult.trustGrade)}`}>
                {scoreResult.trustGrade}
              </div>
            </div>

            <div className="mb-4">
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(scoreResult.score)}`}
                  style={{ width: `${scoreResult.score}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Prediction Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{width: `${mlData?.ml_metadata.prediction_confidence || 0}%`}} />
                </div>
                <span className="text-sm font-medium">{mlData?.ml_metadata.prediction_confidence || 0}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">Risk Level</span>
              <Badge variant="outline" className={`bg-transparent ${getRiskBadgeClass(scoreResult.riskLevel)}`}>
                {scoreResult.riskLevel} Risk
              </Badge>
            </div>
          </motion.div>

          {/* Card 3: Lending Readiness */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 shadow-xl"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Lending Readiness</h3>
                <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getReadinessColor(scoreResult.lendingReadiness)}`}>
                  {getReadinessIcon(scoreResult.lendingReadiness)}
                  <span className="font-medium">{scoreResult.lendingReadiness}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Suggested Loan Range</span>
                <span className="text-sm font-medium text-foreground">{scoreResult.suggestedLoanRange}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Re-evaluation Period
                </span>
                <span className="text-sm font-medium text-foreground">{scoreResult.reEvaluationDays} days</span>
              </div>
            </div>

            {scoreResult.score < 50 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Profile not ready for re-application yet. Improve signals and wait {scoreResult.reEvaluationDays} days.
                </p>
              </div>
            )}
          </motion.div>

          {/* Card 5: Improvement Suggestions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 shadow-xl"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Improvement Suggestions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Actionable steps to improve your score</p>
              </div>
            </div>

            <div className="space-y-3">
              {scoreResult.improvements.map((suggestion, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">{idx + 1}</span>
                  </div>
                  <p className="text-sm text-foreground">{suggestion}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 4: Signal Breakdown - Full Width */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 shadow-xl overflow-hidden"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Signal Breakdown</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Explainability of your credit score</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Signal</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Impact</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreResult.signals.map((signal, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-foreground">{signal.signal}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground capitalize">{signal.category}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`signal-badge ${
                            signal.impact === 'positive'
                              ? 'signal-badge-positive'
                              : signal.impact === 'neutral'
                              ? 'signal-badge-neutral'
                              : 'signal-badge-negative'
                          }`}
                        >
                          {signal.impact === 'positive' ? '+' : signal.impact === 'neutral' ? '±' : '−'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm font-medium text-foreground">+{signal.score}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{signal.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50"
        >
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            True Real-World Fintech Architecture
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Powered by a <strong>Random Forest Regressor</strong> trained on hundreds of simulated records.</li>
            <li>• Uses Account Aggregator (AA) proxies like Average Monthly Balance and Cheque Bounce rate.</li>
            <li>• Uses GSTN/ Bureau proxies like ITR Filing Status and Bureau Vintage.</li>
            <li>• Live predictions generated dynamically by a Python FastAPI Inference server.</li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="container mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
