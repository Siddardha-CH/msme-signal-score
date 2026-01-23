// Landing Page - MSME Invisible Credit Score
// Clean white UI with GSTIN input and two action buttons

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Search, Plus, AlertCircle, Building2 } from 'lucide-react';
import { useMSMEStore } from '@/hooks/use-msme-store';
import { isValidGSTIN } from '@/lib/csv-store';

const Index = () => {
  const navigate = useNavigate();
  const { find, isLoading } = useMSMEStore();
  const [gstin, setGstin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCheckScore = () => {
    setError(null);
    const trimmedGstin = gstin.trim().toUpperCase();

    if (!trimmedGstin) {
      setError('Please enter a GSTIN');
      return;
    }

    if (!isValidGSTIN(trimmedGstin)) {
      setError('Invalid GSTIN format. Please check and try again.');
      return;
    }

    const record = find(trimmedGstin);
    if (record) {
      navigate(`/dashboard/${trimmedGstin}`);
    } else {
      setError('No MSME record found. Please add details first.');
    }
  };

  const handleAddUpdate = () => {
    setError(null);
    const trimmedGstin = gstin.trim().toUpperCase();

    if (!trimmedGstin) {
      // Go to add form without pre-filled GSTIN
      navigate('/msme/new');
      return;
    }

    if (!isValidGSTIN(trimmedGstin)) {
      setError('Invalid GSTIN format. Please check and try again.');
      return;
    }

    const record = find(trimmedGstin);
    if (record) {
      // Go to update form
      navigate(`/msme/edit/${trimmedGstin}`);
    } else {
      // Go to add form with GSTIN pre-filled
      navigate(`/msme/new?gstin=${trimmedGstin}`);
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
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg text-foreground">MSME Credit Score</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full mb-6">
            <Building2 className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">Fintech Pre-Screening Tool</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4 tracking-tight">
            MSME Invisible Credit Score
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Loan readiness assessment without financial documents. Using compliance, activity, and stability signals.
          </p>
        </div>

        {/* GSTIN Input Card */}
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm animate-slide-up">
          <label className="block text-sm font-medium text-foreground mb-2">
            Enter GSTIN
          </label>
          <div className="relative mb-4">
            <Input
              type="text"
              value={gstin}
              onChange={(e) => {
                setGstin(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g., 29ABCDE1234F1Z5"
              className="h-14 text-lg font-mono tracking-wider pr-12"
              maxLength={15}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <span className="text-xs font-medium">{gstin.length}/15</span>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleCheckScore}
              className="flex-1 h-12 text-base font-medium"
              size="lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Check Credit Score
            </Button>
            <Button
              onClick={handleAddUpdate}
              variant="outline"
              className="flex-1 h-12 text-base font-medium"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add / Update MSME
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Enter a valid 15-character GSTIN to check score or add/update business details
          </p>
        </div>

        {/* Trust Section */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
            Why this score can be trusted
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-sm text-muted-foreground">Consent-based operational signals only</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm text-muted-foreground">No bank balances or transaction amounts</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm text-muted-foreground">Explainable rule-based scoring</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
            This is a hackathon MVP. In production, this CSV-backed signal store would be fed automatically via GST verification APIs, Account Aggregator framework, and utility partners.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
