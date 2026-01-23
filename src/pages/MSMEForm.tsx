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
import { isValidGSTIN } from '@/lib/csv-store';
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

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load existing record AFTER store is initialized (critical for edit mode)
  useEffect(() => {
    if (isLoading || dataLoaded) return;
    
    if (isEditMode && editGstin) {
      const existingRecord = find(editGstin);
      if (existingRecord) {
        setGstin(existingRecord.gstin);
        setBusinessName(existingRecord.business_name);
        setEstablishedYear(existingRecord.established_year.toString());
        setGstCompliance(existingRecord.gst_compliance);
        setUtilityPunctuality(existingRecord.utility_punctuality);
        setUpiFrequency(existingRecord.upi_frequency);
        setDigitalPresence(existingRecord.digital_presence);
        setLocationStability(existingRecord.location_stability);
        setDataLoaded(true);
      }
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

    try {
      if (isEditMode) {
        update(gstin, {
          business_name: businessName.trim(),
          gst_compliance: gstCompliance,
          utility_punctuality: utilityPunctuality,
          upi_frequency: upiFrequency,
          digital_presence: digitalPresence,
          location_stability: locationStability,
        });
      } else {
        add({
          gstin: gstin.trim().toUpperCase(),
          business_name: businessName.trim(),
          established_year: year,
          gst_compliance: gstCompliance,
          utility_punctuality: utilityPunctuality,
          upi_frequency: upiFrequency,
          digital_presence: digitalPresence,
          location_stability: locationStability,
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg text-foreground">
            {isEditMode ? 'Update MSME' : 'Add New MSME'}
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-slide-up">
            <h2 className="text-lg font-semibold text-foreground mb-6">Business Information</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="gstin" className="flex items-center gap-2">
                  GSTIN
                  {isEditMode && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="gstin"
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g., 29ABCDE1234F1Z5"
                  className="mt-1 font-mono tracking-wider"
                  maxLength={15}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Sri Sai Traders"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="establishedYear" className="flex items-center gap-2">
                  Established Year
                  {isEditMode && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="e.g., 2018"
                  className="mt-1"
                  min={1900}
                  max={new Date().getFullYear()}
                  disabled={isEditMode}
                />
              </div>
            </div>
          </div>

          {/* Signal Inputs Card */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-semibold text-foreground mb-6">Operational Signals</h2>

            <div className="space-y-6">
              {/* GST Compliance */}
              <div>
                <Label className="text-sm font-medium">GST Compliance</Label>
                <p className="text-xs text-muted-foreground mb-3">Filing status of GST returns</p>
                <RadioGroup
                  value={gstCompliance}
                  onValueChange={(v) => setGstCompliance(v as GstCompliance)}
                  className="flex flex-wrap gap-2"
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
          </div>

          {/* Legend Card */}
          <div className="bg-muted/50 rounded-xl p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Signal Categories Guide:</p>
                <ul className="space-y-0.5">
                  <li>• <strong>On Time / High / Strong / Stable</strong> — Best score impact (+)</li>
                  <li>• <strong>Occasionally Late / Medium / Basic / Changed Once</strong> — Neutral impact (±)</li>
                  <li>• <strong>Frequently Late / Low / None / Unstable</strong> — Negative impact (−)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full h-12 text-base font-medium" size="lg" disabled={isSaving}>
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : isEditMode ? 'Update & Calculate Score' : 'Save & Calculate Score'}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default MSMEForm;
