import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Zap, CreditCard, ArrowRight, Loader2, Star, Calendar, Heart, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import CheckoutConfirmation from '../../components/subscription/CheckoutConfirmation';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { Charity } from '../../types';

const Subscription: React.FC = () => {
  const { profile } = useAuth();
  usePageTitle('Membership & Billing');
  const { 
    subscription, 
    loading, 
    createCheckoutSession, 
    createPortalSession,
    activateMembership,
    cancelMembership,
    isActive,
    isPremium
  } = useSubscription();

  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<{ type: 'monthly' | 'yearly', price: number } | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchCharities = async () => {
      const { data } = await supabase.from('charities').select('*');
      if (data) setCharities(data);
    };
    fetchCharities();
  }, []);

  const handleActivate = async () => {
    if (!selectedPlan) return;
    try {
      await createCheckoutSession(selectedPlan.type);
    } catch (err) {
      console.error('Activation failed:', err);
      throw err;
    }
  };

  const handleManage = async () => {
    setProcessing('portal');
    try {
      await createPortalSession();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelMembership();
      setShowCancelConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const activeCharity = charities.find(c => c.id === (subscription?.charity_id || profile?.selected_charity_id));

  if (loading && !subscription && !selectedPlan) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine current plan display name
  const currentPlanName = subscription?.plan_type === 'yearly' 
    ? 'Annual Plan' 
    : (subscription?.plan_type === 'monthly' ? 'Monthly Plan' : 'Community Tier');

  // Configured prices from existing subscription or neutral fallback
  const currentAmount = subscription?.amount ? Number(subscription.amount) : null;

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Membership Status</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Membership & Billing
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Manage your membership plan, billing cycle, and direct charitable giving preferences.
            </p>
          </div>

          {isActive && (
            <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Status
                </span>
                <span className={cn(
                  "font-display font-bold text-sm flex items-center justify-end gap-1.5",
                  subscription?.status === 'active' ? "text-primary" : "text-destructive"
                )}>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    subscription?.status === 'active' ? "bg-primary animate-pulse" : "bg-destructive"
                  )} />
                  {subscription?.status === 'active' ? 'Active' : (subscription?.status || 'Inactive')}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Current Plan
                </span>
                <span className="font-display font-bold text-sm text-foreground">
                  {currentPlanName}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {isActive ? (
              <div className="bg-surface-container border border-white/10 rounded-3xl p-8 space-y-8 shadow-xl">
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      Active Membership
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your monthly draw entries and charitable contribution are actively running.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                    {isPremium ? 'Draw Eligible' : 'Community Access'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium block mb-1">
                        Billing Schedule
                      </span>
                      <p className="text-lg font-display font-bold text-foreground">
                        {subscription?.plan_type === 'yearly' ? 'Annual Billing' : (subscription?.plan_type === 'monthly' ? 'Monthly Billing' : 'Free Community Plan')}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground font-medium block mb-1">
                        Next Renewal Date
                      </span>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {subscription?.renewal_date 
                          ? new Date(subscription.renewal_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Ongoing'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground font-medium block mb-1">
                        Current Amount
                      </span>
                      <p className="text-lg font-display font-bold text-foreground">
                        {currentAmount !== null ? formatCurrency(currentAmount) : 'Standard Plan Rate'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground font-medium block mb-1">
                        Charity Contribution
                      </span>
                      <p className="text-sm font-semibold text-primary">
                        {subscription?.charity_percentage || 10}% of membership
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <button
                    onClick={handleManage}
                    disabled={!!processing}
                    className="px-6 py-2.5 rounded-xl bg-surface-container-high border border-white/10 text-foreground font-semibold text-xs hover:bg-surface-container-highest transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {processing === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    <span>Manage Payment Details</span>
                  </button>

                  {isPremium && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-xs font-semibold text-destructive/70 hover:text-destructive transition-colors"
                    >
                      Cancel Membership
                    </button>
                  )}
                </div>

                {/* Plan switch options if on monthly */}
                {subscription?.plan_type === 'monthly' && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h3 className="font-display font-bold text-base text-foreground mb-3">
                      Switch to Annual Plan
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Lock in a full year of draw entries and save annually on your membership dues.
                    </p>
                    <button
                      onClick={() => setSelectedPlan({ type: 'yearly', price: 4999 })}
                      className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-md"
                    >
                      Switch to Annual Plan (₹4,999/yr)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Plans Selection Cards with fixed demo pricing */
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Select a Membership Plan
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a plan to enter the monthly draw and direct charitable contributions.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    {
                      type: 'monthly' as const,
                      name: 'Monthly Membership',
                      badge: 'Monthly Draw Entry',
                      priceAmount: 499,
                      priceDisplay: '₹499',
                      periodDisplay: '/ month',
                      icon: Zap,
                      desc: 'Flexible monthly participation with full eligibility in all prize tiers.',
                      features: ['Monthly cash draw entry', '10%+ to your chosen charity', 'Full scoring dashboard', 'Cancel anytime']
                    },
                    {
                      type: 'yearly' as const,
                      name: 'Annual Membership',
                      badge: 'Best Value',
                      priceAmount: 4999,
                      priceDisplay: '₹4,999',
                      periodDisplay: '/ year',
                      icon: Star,
                      desc: 'Year-round participation with maximum impact and annual billing savings.',
                      features: ['All 12 monthly draws', 'Continuous charity impact', 'Priority verification', 'Discounted annual rate']
                    }
                  ].map((p) => (
                    <div
                      key={p.type}
                      onClick={() => setSelectedPlan({ type: p.type, price: p.priceAmount })}
                      className="bg-surface-container border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-primary/30 hover:bg-surface-container-high transition-all flex flex-col justify-between group shadow-lg"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {p.badge}
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <p.icon className="w-5 h-5" />
                          </div>
                        </div>

                        <h3 className="font-display font-bold text-xl text-foreground mb-1">
                          {p.name}
                        </h3>

                        <div className="flex items-baseline gap-1 mb-3">
                          <span className="text-2xl font-display font-extrabold text-foreground">{p.priceDisplay}</span>
                          <span className="text-xs text-muted-foreground font-medium">{p.periodDisplay}</span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                          {p.desc}
                        </p>

                        <div className="space-y-2 pt-4 border-t border-white/10 mb-6">
                          {p.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary group-hover:underline flex items-center gap-1">
                          <span>Select Plan</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Membership Features Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: 'Stableford Scoring', desc: 'Log your club rounds. 5 latest scores represent your official numbers.' },
                { icon: ShieldCheck, title: 'Charity Giving', desc: '100% of your designated contribution goes directly to your charity.' },
                { icon: Award, title: 'Guaranteed Cash Prizes', desc: '5-match (40%), 4-match (35%), and 3-match (25%) prize distribution.' },
                { icon: CreditCard, title: 'Flexible Billing', desc: 'Manage or cancel your subscription anytime with zero lock-in.' }
              ].map((feat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-surface-container border border-white/10 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <feat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-foreground">{feat.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Active Partner Card */}
          <div className="space-y-6">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-white/10 p-2 mx-auto flex items-center justify-center font-display font-bold text-primary text-xl">
                {activeCharity ? (
                  activeCharity.logo_url ? <img src={activeCharity.logo_url} alt={activeCharity.name} className="w-full h-full object-contain" /> : activeCharity.name.charAt(0)
                ) : (
                  <Heart className="w-8 h-8 text-muted-foreground opacity-40" />
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
                  Designated Charity Partner
                </span>
                <h3 className="font-display font-bold text-lg text-foreground">
                  {activeCharity ? activeCharity.name : 'No Charity Selected'}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeCharity 
                  ? activeCharity.description 
                  : 'Select a verified charity in your settings to direct your monthly contribution.'}
              </p>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Your Total Impact</span>
                <span className="font-display font-bold text-primary">
                  {formatCurrency(profile?.total_impact || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CheckoutConfirmation 
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onConfirm={handleActivate}
        planType={selectedPlan?.type || 'monthly'}
        amount={selectedPlan?.price || 0}
        selectedCharity={activeCharity}
      />

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container border border-white/10 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl space-y-6"
            >
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">
                  Cancel Membership?
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Canceling will pause your monthly draw entries and recurring charity contributions at the end of the current billing cycle. Your historical scores will remain safe.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Cancellation'}
                </button>
                <button 
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full py-3 rounded-xl bg-surface-container-high border border-white/10 text-foreground font-semibold text-xs hover:bg-surface-container-highest transition-colors"
                >
                  Keep My Membership
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Subscription;
