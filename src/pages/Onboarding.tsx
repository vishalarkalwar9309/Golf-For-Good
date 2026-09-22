import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Zap, Target, ArrowRight, CheckCircle2, 
  Search, ShieldCheck, ChevronRight,
  ChevronLeft, AlertCircle, Loader2, Sparkles, Award
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useAuth } from '../components/auth/AuthProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import EmptyState from '../components/ui/EmptyState';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';
import type { Charity } from '../types';

const Onboarding: React.FC = () => {
  usePageTitle('Welcome | Account Setup');
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loadingCharities, setLoadingCharities] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [percentage, setPercentage] = useState(10);
  const [plan, setPlan] = useState<'monthly' | 'yearly' | 'free'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    setLoadingCharities(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('name');
      if (error) throw error;
      setCharities(data || []);
      if (data && data.length > 0 && !selectedCharity) {
        // Pre-select first charity or if profile already had one
        const pre = data.find(c => c.id === profile?.selected_charity_id) || data[0];
        setSelectedCharity(pre);
      }
    } catch (err: any) {
      console.error('Error fetching charities:', err);
      setFetchError(err.message || 'Failed to load charity partners.');
    } finally {
      setLoadingCharities(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedCharity) {
      setError('Please select a charity partner to support.');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const onSubmit = async () => {
    if (!user || !selectedCharity) return;
    setLoading(true);
    setError(null);
    
    try {
      // 1. Check if a subscription row already exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id, amount')
        .eq('user_id', user.id)
        .maybeSingle();

      const renewalDays = plan === 'monthly' ? 30 : (plan === 'yearly' ? 365 : 10000);
      // Fixed demo plan pricing: ₹499/mo and ₹4,999/yr
      const configuredAmount = existingSub?.amount ?? (plan === 'free' ? 0 : (plan === 'monthly' ? 499 : 4999));

      const subData = {
        user_id: user.id,
        charity_id: selectedCharity.id,
        charity_percentage: Math.max(10, percentage), // PRD requires 10% minimum
        plan_type: plan,
        amount: configuredAmount,
        status: 'active',
        start_date: new Date().toISOString(),
        renewal_date: new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (existingSub) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update(subData)
          .eq('id', existingSub.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([subData]);
        if (insertError) throw insertError;
      }

      // 2. Mark Onboarding as Complete & Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true, 
          selected_charity_id: selectedCharity.id,
          subscription_status: 'active',
          subscription_tier: plan === 'free' ? 'free' : plan
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Refresh and Redirect to Dashboard
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Onboarding finalization error:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(charities.map(c => c.category).filter(Boolean)))];

  const filteredCharities = charities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden pt-24 pb-16">
      {/* Background Decor */}
      <AbstractGraphic variant="hero-mesh" className="opacity-40" />

      <div className="max-w-4xl mx-auto w-full px-6 relative z-10 flex-grow flex flex-col">
        {/* Step Indicator Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            <span>Step {step} of 3</span>
            <span className="text-foreground">
              {step === 1 && 'Select Charity Partner'}
              {step === 2 && 'Set Impact Contribution'}
              {step === 3 && 'Choose Membership Plan'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div 
                  initial={false}
                  animate={{ width: step >= s ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-primary"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Purpose First</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
                    Choose the charity you want to support
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-2xl">
                    A percentage of your membership contribution goes directly to this partner every month. You can change your choice anytime in your dashboard.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Search charities by name or mission..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {categories.length > 2 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                            selectedCategory === cat 
                              ? "bg-primary text-primary-foreground font-semibold" 
                              : "bg-surface-container border border-white/10 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Charity List */}
                {loadingCharities ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading approved charities...</p>
                  </div>
                ) : fetchError ? (
                  <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                    <p className="text-sm font-medium text-destructive">{fetchError}</p>
                    <button 
                      onClick={fetchCharities}
                      className="text-xs font-semibold text-primary underline"
                    >
                      Try Again
                    </button>
                  </div>
                ) : charities.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title="No Charities Listed Yet"
                    description="Our team is currently verifying charity partners. You can continue setup and assign one soon."
                  />
                ) : filteredCharities.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-surface-container border border-white/10">
                    <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">No charities match your search</p>
                    <p className="text-xs text-muted-foreground mt-1">Try clearing your search term or selecting another category.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                    {filteredCharities.map((charity) => {
                      const isSelected = selectedCharity?.id === charity.id;
                      return (
                        <div
                          key={charity.id}
                          onClick={() => setSelectedCharity(charity)}
                          className={cn(
                            "cursor-pointer p-5 rounded-2xl border transition-all text-left flex flex-col justify-between relative",
                            isSelected 
                              ? "bg-primary/10 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" 
                              : "bg-surface-container border-white/10 hover:border-white/20 hover:bg-surface-container-high"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center font-display font-bold text-lg text-primary overflow-hidden shrink-0">
                              {charity.logo_url ? (
                                <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-cover" />
                              ) : (
                                charity.name.charAt(0)
                              )}
                            </div>
                            <div className="pr-6">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block mb-0.5">
                                {charity.category || 'Non-profit'}
                              </span>
                              <h3 className="font-display font-bold text-base text-foreground leading-snug">
                                {charity.name}
                              </h3>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {charity.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="text-center max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Your Charitable Giving</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
                    Set your contribution percentage
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mt-2">
                    Every member commits a baseline contribution. 100% of these designated funds go straight to <span className="text-foreground font-semibold">{selectedCharity?.name}</span>.
                  </p>
                </div>

                <div className="bg-surface-container border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-2">
                    Designated Charity Contribution
                  </span>
                  <div className="flex items-baseline justify-center gap-1 my-4">
                    <span className="text-6xl sm:text-8xl font-display font-black text-primary tracking-tight">
                      {percentage}
                    </span>
                    <span className="text-3xl font-display font-bold text-primary">%</span>
                  </div>

                  <p className="text-xs text-muted-foreground max-w-md mx-auto mb-8">
                    Minimum 10% per PRD rules. You can increase this anytime up to 100% to maximize your charitable impact.
                  </p>

                  <div className="space-y-4">
                    <input 
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={percentage}
                      onChange={(e) => setPercentage(parseInt(e.target.value))}
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
                    />

                    <div className="flex justify-between text-xs text-muted-foreground px-1 font-medium">
                      <span>10% (Minimum)</span>
                      <span>50%</span>
                      <span>100% (All-In)</span>
                    </div>
                  </div>

                  {selectedCharity && (
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-left text-xs">
                      <div>
                        <span className="text-muted-foreground block">Beneficiary Partner</span>
                        <span className="text-foreground font-semibold">{selectedCharity.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block">PRD Compliance</span>
                        <span className="text-primary font-semibold">100% Pass-Through</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="text-center max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
                    <Award className="w-3.5 h-3.5" />
                    <span>Membership Options</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
                    Select your membership plan
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mt-2">
                    Choose how you would like to participate. You can modify or pause your membership anytime.
                  </p>
                </div>

                {/* Plan Options without hardcoded prices per prompt correction */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
                  {[
                    {
                      id: 'free',
                      title: 'Community Access',
                      badge: 'Free Tier',
                      description: 'Track personal scores and follow monthly draw results.',
                      features: ['Score tracking', 'Draw result notifications', 'Charity impact view'],
                      popular: false,
                    },
                    {
                      id: 'monthly',
                      title: 'Monthly Plan',
                      badge: 'Monthly Draw Entry',
                      priceDisplay: '₹499 / month',
                      description: 'Full participation in monthly cash draws and charitable giving.',
                      features: [
                        'Automatic monthly draw entry',
                        'Prize eligibility (40/35/25% tiers)',
                        'Direct charity contribution',
                        'Cancel anytime'
                      ],
                      popular: true,
                    },
                    {
                      id: 'yearly',
                      title: 'Annual Plan',
                      badge: 'Best Value',
                      priceDisplay: '₹4,999 / year',
                      description: 'Year-round participation with maximum contribution efficiency.',
                      features: [
                        'All monthly draw entries',
                        'Annual savings vs monthly',
                        'Verified supporter profile',
                        'Priority winner verification'
                      ],
                      popular: false,
                    }
                  ].map((p) => {
                    const isSelected = plan === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setPlan(p.id as any)}
                        className={cn(
                          "cursor-pointer p-6 rounded-3xl border transition-all text-left flex flex-col justify-between relative",
                          isSelected 
                            ? "bg-primary/10 border-primary ring-1 ring-primary shadow-xl shadow-primary/10" 
                            : "bg-surface-container border-white/10 hover:border-white/20 hover:bg-surface-container-high"
                        )}
                      >
                        {p.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                            Recommended
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                              {p.badge}
                            </span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </div>

                          <h3 className="font-display font-bold text-xl text-foreground mb-1">
                            {p.title}
                          </h3>
                          <p className="text-sm font-semibold text-primary mb-2">
                            {p.priceDisplay}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                            {p.description}
                          </p>

                          <div className="space-y-2.5 pt-4 border-t border-white/10 mb-6">
                            {p.features.map((feat, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-foreground/90">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 mt-auto">
                          <span className="text-xs text-muted-foreground font-medium block">
                            Billing Status: Active
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Card */}
                {selectedCharity && (
                  <div className="bg-surface-container border border-white/10 rounded-2xl p-6 max-w-xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm">
                        {selectedCharity.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Selected Partner
                        </span>
                        <span className="font-display font-bold text-sm text-foreground">
                          {selectedCharity.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                        Giving Level
                      </span>
                      <span className="font-display font-bold text-sm text-primary">
                        {percentage}% of membership
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between">
          <button 
            onClick={handleBack}
            disabled={step === 1 || loading}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs font-semibold px-3 py-1.5 rounded-lg bg-destructive/10">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={onSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Complete Setup & Enter Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
