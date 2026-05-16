// Add / Update MSME Form
// Radio button controlled inputs for all signals

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, ArrowLeft, Save, AlertCircle, Info, Lock } from 'lucide-react';
import { useMSMEStore } from '@/hooks/use-msme-store';
import { useAuthStore } from '@/hooks/use-auth';
import { isValidGSTIN } from '@/lib/csv-store';
import { motion } from 'framer-motion';
import {
  GstCompliance,
  UtilityPunctuality,
  UpiFrequency,
  DigitalPresence,
  LocationStability,
} from '@/lib/types';

// Signal options with labels
const GST_OPTIONS: { value: GstCompliance; label: string }[] = [
  { value: 'on_time', label: 'On Time' },
  { value: 'occasionally_late', label: 'Occasionally Late' },
  { value: 'frequently_late', label: 'Frequently Late' },
];

const UTILITY_OPTIONS: { value: UtilityPunctuality; label: string }[] = [
  { value: 'on_time', label: 'On Time' },
  { value: 'sometimes_late', label: 'Sometimes Late' },
  { value: 'often_late', label: 'Often Late' },
];

const UPI_OPTIONS: { value: UpiFrequency; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const DIGITAL_OPTIONS: { value: DigitalPresence; label: string }[] = [
  { value: 'strong', label: 'Strong' },
  { value: 'basic', label: 'Basic' },
  { value: 'none', label: 'None' },
];

const LOCATION_OPTIONS: { value: LocationStability; label: string }[] = [
  { value: 'stable', label: 'Stable' },
  { value: 'changed_once', label: 'Changed Once' },
  { value: 'unstable', label: 'Unstable' },
];

const MSMEForm = () => {
  const navigate = useNavigate();
  const { gstin: editGstin } = useParams();
  const [searchParams] = useSearchParams();
  const prefillGstin = searchParams.get('gstin') || '';
  const { find, add, update, isLoading } = useMSMEStore();
  const { isAdmin } = useAuthStore();
  
  const isReadOnly = !isAdmin();

  const isEditMode = Boolean(editGstin);

  // Form state
  const [gstin, setGstin] = useState(editGstin || prefillGstin);
  const [businessName, setBusinessName] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [gstCompliance, setGstCompliance] = useState<GstCompliance>('on_time');
  const [utilityPunctuality, setUtilityPunctuality] = useState<UtilityPunctuality>('on_time');
  const [upiFrequency, setUpiFrequency] = useState<UpiFrequency>('medium');
  const [digitalPresence, setDigitalPresence] = useState<DigitalPresence>('basic');
  const [locationStability, setLocationStability] = useState<LocationStability>('stable');

  // NEW SIGNALS
  const [avgMonthlyBalance, setAvgMonthlyBalance] = useState('100000');
  const [bounceRatePercent, setBounceRatePercent] = useState('0');
  const [itrFiledLastYear, setItrFiledLastYear] = useState('true');
  const [bureauVintageMonths, setBureauVintageMonths] = useState('24');
  const [monthlyRevenueTrend, setMonthlyRevenueTrend] = useState<'growing' | 'stable' | 'declining'>('stable');

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load existing record AFTER store is initialized
  useEffect(() => {
    if (isLoading || dataLoaded) return;
    
    if (isEditMode && editGstin) {
      const loadRecord = async () => {
        const existingRecord = await find(editGstin);
        if (existingRecord) {
          setGstin(existingRecord.gstin);
          setBusinessName(existingRecord.business_name);
          setEstablishedYear(existingRecord.established_year.toString());
          setGstCompliance(existingRecord.gst_compliance);
          setUtilityPunctuality(existingRecord.utility_punctuality);
          setUpiFrequency(existingRecord.upi_frequency);
          setDigitalPresence(existingRecord.digital_presence);
          setLocationStability(existingRecord.location_stability);
          setAvgMonthlyBalance(existingRecord.avg_monthly_balance.toString());
          setBounceRatePercent(existingRecord.bounce_rate_percent.toString());
          setItrFiledLastYear(existingRecord.itr_filed_last_year.toString());
          setBureauVintageMonths(existingRecord.bureau_vintage_months.toString());
          setMonthlyRevenueTrend(existingRecord.monthly_revenue_trend);
          setDataLoaded(true);
        }
      };
      loadRecord();
    } else {
      setDataLoaded(true);
    }
  }, [isLoading, isEditMode, editGstin, find, dataLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!gstin.trim()) {
      setError('GSTIN is required');
      return;
    }

    if (!isValidGSTIN(gstin)) {
      setError('Invalid GSTIN format');
      return;
    }

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    const year = parseInt(establishedYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1900 || year > currentYear) {
      setError(`Established year must be between 1900 and ${currentYear}`);
      return;
    }

    setIsSaving(true);

    const commonData = {
      business_name: businessName.trim(),
      gst_compliance: gstCompliance,
      utility_punctuality: utilityPunctuality,
      upi_frequency: upiFrequency,
      digital_presence: digitalPresence,
      location_stability: locationStability,
      avg_monthly_balance: parseFloat(avgMonthlyBalance) || 0,
      bounce_rate_percent: parseFloat(bounceRatePercent) || 0,
      itr_filed_last_year: itrFiledLastYear === 'true',
      bureau_vintage_months: parseInt(bureauVintageMonths) || 0,
      monthly_revenue_trend: monthlyRevenueTrend,
    };

    try {
      if (isEditMode) {
        await update(gstin, commonData);
      } else {
        await add({
          gstin: gstin.trim().toUpperCase(),
          established_year: year,
          ...commonData
        });
      }

      // Navigate to dashboard
      navigate(`/dashboard/${gstin.trim().toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-300 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-semibold text-lg text-white">
            {isEditMode ? 'Update MSME' : 'Add New MSME'}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {isReadOnly && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-lg shadow-amber-500/5">
                <Lock className="w-6 h-6 text-amber-500 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-amber-500">View-Only Mode</h3>
                    <p className="text-sm text-amber-500/80">You do not have administrator privileges. You can view this record but cannot save changes.</p>
                </div>
            </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl shadow-xl"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Business Information</h2>

            <div className="space-y-5">
              <div>
                <Label htmlFor="gstin" className="flex items-center gap-2 text-slate-300">
                  GSTIN
                  {isEditMode && <Lock className="w-3 h-3 text-slate-500" />}
                </Label>
                <Input
                  id="gstin"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g., 29ABCDE1234F1Z5"
                  className="mt-2 font-mono tracking-wider bg-slate-950/50 border-slate-700 text-white rounded-xl h-12"
                  maxLength={15}
                  disabled={isEditMode || isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="businessName" className="text-slate-300">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Sri Sai Traders"
                  className="mt-2 bg-slate-950/50 border-slate-700 text-white rounded-xl h-12"
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <Label htmlFor="establishedYear" className="flex items-center gap-2 text-slate-300">
                  Established Year
                  {isEditMode && <Lock className="w-3 h-3 text-slate-500" />}
                </Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="e.g., 2018"
                  className="mt-2 bg-slate-950/50 border-slate-700 text-white rounded-xl h-12"
                  min={1900}
                  max={new Date().getFullYear()}
                  disabled={isEditMode || isReadOnly}
                />
              </div>
            </div>
          </motion.div>

          {/* Signal Inputs Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl shadow-xl"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Operational Signals</h2>

            <div className="space-y-8">
              {/* GST Compliance */}
              <div>
                <Label className="text-sm font-medium text-slate-300">GST Compliance</Label>
                <p className="text-xs text-slate-500 mb-3">Filing status of GST returns</p>
                <RadioGroup
                  value={gstCompliance}
                  onValueChange={(v) => setGstCompliance(v as GstCompliance)}
                  className="flex flex-wrap gap-3"
                  disabled={isReadOnly}
                >
                  {GST_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`gst-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`gst-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Utility Punctuality */}
              <div>
                <Label className="text-sm font-medium">Utility Bill Punctuality</Label>
                <p className="text-xs text-muted-foreground mb-3">Payment behavior for electricity, water, etc.</p>
                <RadioGroup
                  value={utilityPunctuality}
                  onValueChange={(v) => setUtilityPunctuality(v as UtilityPunctuality)}
                  className="flex flex-wrap gap-2"
                >
                  {UTILITY_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`utility-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`utility-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* UPI Frequency */}
              <div>
                <Label className="text-sm font-medium">UPI Transaction Frequency</Label>
                <p className="text-xs text-muted-foreground mb-3">Volume of digital transactions (count only, no amounts)</p>
                <RadioGroup
                  value={upiFrequency}
                  onValueChange={(v) => setUpiFrequency(v as UpiFrequency)}
                  className="flex flex-wrap gap-2"
                >
                  {UPI_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`upi-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`upi-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Digital Presence */}
              <div>
                <Label className="text-sm font-medium">Digital Presence</Label>
                <p className="text-xs text-muted-foreground mb-3">Online visibility (website, social media, listings)</p>
                <RadioGroup
                  value={digitalPresence}
                  onValueChange={(v) => setDigitalPresence(v as DigitalPresence)}
                  className="flex flex-wrap gap-2"
                >
                  {DIGITAL_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`digital-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`digital-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Location Stability */}
              <div>
                <Label className="text-sm font-medium">Location Stability</Label>
                <p className="text-xs text-muted-foreground mb-3">Business address consistency</p>
                <RadioGroup
                  value={locationStability}
                  onValueChange={(v) => setLocationStability(v as LocationStability)}
                  className="flex flex-wrap gap-2"
                >
                  {LOCATION_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <RadioGroupItem value={opt.value} id={`location-${opt.value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`location-${opt.value}`}
                        className="px-4 py-2 rounded-lg border border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </motion.div>

          {/* New Financial Signals Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-8 rounded-3xl shadow-xl"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Financial & Behavioral Signals (Live Sync)</h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="avgMonthlyBalance">Average Monthly Balance (₹)</Label>
                <p className="text-xs text-muted-foreground mb-1">Proxy for Account Aggregator bank statement fetch</p>
                <Input
                  id="avgMonthlyBalance"
                  type="number"
                  value={avgMonthlyBalance}
                  onChange={(e) => setAvgMonthlyBalance(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bounceRatePercent">Cheque Bounce Rate (%)</Label>
                <p className="text-xs text-muted-foreground mb-1">Critical risk indicator</p>
                <Input
                  id="bounceRatePercent"
                  type="number"
                  step="0.1"
                  value={bounceRatePercent}
                  onChange={(e) => setBounceRatePercent(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">ITR Filed Last Year?</Label>
                <RadioGroup
                  value={itrFiledLastYear}
                  onValueChange={setItrFiledLastYear}
                  className="flex flex-wrap gap-2 mt-2"
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="true" id="itr-yes" className="peer sr-only" />
                    <Label htmlFor="itr-yes" className="px-4 py-2 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted">Yes</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="false" id="itr-no" className="peer sr-only" />
                    <Label htmlFor="itr-no" className="px-4 py-2 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-muted">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="bureauVintageMonths">Credit Bureau Vintage (Months)</Label>
                <p className="text-xs text-muted-foreground mb-1">How long they've had a credit footprint</p>
                <Input
                  id="bureauVintageMonths"
                  type="number"
                  value={bureauVintageMonths}
                  onChange={(e) => setBureauVintageMonths(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Monthly Revenue Trend</Label>
                <RadioGroup
                  value={monthlyRevenueTrend}
                  onValueChange={(v: any) => setMonthlyRevenueTrend(v)}
                  className="flex flex-wrap gap-2 mt-2"
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="growing" id="rev-growing" className="peer sr-only" />
                    <Label htmlFor="rev-growing" className="px-4 py-2 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary">Growing</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="stable" id="rev-stable" className="peer sr-only" />
                    <Label htmlFor="rev-stable" className="px-4 py-2 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary">Stable</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="declining" id="rev-declining" className="peer sr-only" />
                    <Label htmlFor="rev-declining" className="px-4 py-2 rounded-lg border border-border cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary hover:bg-destructive/10 peer-data-[state=checked]:text-destructive peer-data-[state=checked]:border-destructive">Declining</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </motion.div>

          {/* Legend Card */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 shadow-inner"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-semibold text-slate-300 mb-2">Signal Processing Heuristics:</p>
                <ul className="space-y-1.5 ml-1">
                  <li>• <strong>On Time / High / Strong / Stable</strong> — Strong Positive Impact (<span className="text-green-500">+</span>)</li>
                  <li>• <strong>Occasionally Late / Medium / Basic / Changed Once</strong> — Neutral Adjustments (<span className="text-amber-500">±</span>)</li>
                  <li>• <strong>Frequently Late / Low / None / Unstable</strong> — Severe Penalty (<span className="text-red-500">−</span>)</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          {!isReadOnly && (
              <Button type="submit" className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1" disabled={isSaving}>
                <Save className="w-5 h-5 mr-3" />
                {isSaving ? 'Processing Cloud Sync...' : isEditMode ? 'Update & Calculate Score' : 'Save & Calculate Score'}
              </Button>
          )}
        </form>
      </main>
    </div>
  );
};

export default MSMEForm;
