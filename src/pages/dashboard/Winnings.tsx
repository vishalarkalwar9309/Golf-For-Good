import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertCircle, Clock, Lock, Target, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthProvider';
import { useSubscription } from '../../hooks/useSubscription';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { DrawEntry } from '../../types';
import ProofUpload from '../../components/ui/ProofUpload';

const Winnings: React.FC = () => {
  usePageTitle('My Winnings & Payouts');
  const { user, profile } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const [entries, setEntries] = useState<DrawEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('draw_entries')
        .select('*, draw:draws(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching winnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const wonEntries = entries.filter(e => e.prize_amount > 0);
  const pendingProofsCount = wonEntries.filter(e => e.winner_status === 'pending').length;

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
              <Award className="w-4 h-4" />
              <span>Player Rewards</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              My Winnings & Verification
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Track your monthly draw outcomes. Winners must upload a verified scorecard within 48 hours to claim their prize.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 px-6 py-4 rounded-2xl">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
              Lifetime Prize Winnings
            </span>
            <span className="font-display font-black text-3xl text-secondary">
              {formatCurrency(profile?.lifetime_winnings || 0)}
            </span>
          </div>
        </div>

        <div className="relative space-y-6">
          {!isPremium && (
            <div className="p-8 rounded-3xl bg-surface-container border border-white/10 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">
                Membership Inactive
              </h3>
              <p className="text-xs text-muted-foreground">
                Only active members can enter draws, win prizes, and claim rewards.
              </p>
              <Link 
                to="/dashboard/subscription" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md"
              >
                <span>Activate Membership</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {pendingProofsCount > 0 && isPremium && (
            <div className="p-5 bg-secondary/10 border border-secondary/30 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-secondary text-sm mb-0.5">
                  Action Required: Scorecard Verification Needed
                </h4>
                <p className="text-secondary/90">
                  You have {pendingProofsCount} winning entry awaiting scorecard proof. Upload your official club scorecard or app screenshot within 48 hours to confirm your payout.
                </p>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="py-16">
              <EmptyState 
                icon={Award}
                title="No Draw Results Yet"
                description="Once the next monthly draw is finalized, your numbers, match count, and prize eligibility will appear here."
                className="bg-surface-container border border-white/10 rounded-3xl py-16"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "bg-surface-container border rounded-3xl p-6 transition-all flex flex-col lg:flex-row items-center justify-between gap-6",
                    entry.prize_amount > 0 
                      ? "border-secondary/40 shadow-lg shadow-secondary/5 ring-1 ring-secondary/20" 
                      : "border-white/10 opacity-70"
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm",
                        entry.match_count > 0 
                          ? "bg-secondary text-secondary-foreground border-secondary/40 font-bold" 
                          : "bg-surface-container-high border-white/10 text-muted-foreground"
                      )}>
                        <span className="text-[10px] uppercase font-bold">Matches</span>
                        <span className="text-2xl font-display font-black leading-none">
                          {entry.match_count}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        {entry.entry_numbers.map((n, i) => (
                          <div key={i} className="w-5 h-5 rounded bg-surface-container-high border border-white/10 flex items-center justify-center text-[9px] font-bold text-foreground">
                            {n}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-xl text-foreground">
                        {entry.draw?.draw_month || 'Monthly Draw'}
                      </h3>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground mt-1">
                        <span>Draw Date: {formatDate(entry.created_at)}</span>
                        <span>•</span>
                        <span>Mode: {entry.draw?.draw_mode === 'algorithmic' ? 'Algorithmic Weighted' : 'Random Draw'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                      Prize Outcome
                    </span>
                    {entry.prize_amount > 0 ? (
                      <span className="font-display font-black text-3xl text-secondary">
                        {formatCurrency(entry.prize_amount)}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        No Prize Match
                      </span>
                    )}
                  </div>

                  {/* Verification Status / Proof Widget */}
                  {entry.prize_amount > 0 && (
                    <div className="w-full lg:w-80 shrink-0 pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-white/10">
                      {entry.winner_status === 'pending' ? (
                        <ProofUpload drawId={entry.draw_id} entryId={entry.id} onSuccess={fetchEntries} />
                      ) : entry.winner_status === 'pending_verification' ? (
                        <div className="text-center p-3 rounded-2xl bg-secondary/10 border border-secondary/20">
                          <Clock className="w-6 h-6 text-secondary mx-auto mb-1 animate-pulse" />
                          <h5 className="font-semibold text-xs text-secondary">Under Admin Review</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Your scorecard has been submitted and is being verified by the review team.
                          </p>
                        </div>
                      ) : entry.winner_status === 'approved' ? (
                        <div className="text-center p-3 rounded-2xl bg-primary/10 border border-primary/20">
                          <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" />
                          <h5 className="font-semibold text-xs text-primary">Scorecard Approved</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Verification complete. Your payout is scheduled for distribution.
                          </p>
                        </div>
                      ) : entry.winner_status === 'paid' ? (
                        <div className="text-center p-3 rounded-2xl bg-primary/20 border border-primary/30">
                          <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-1" />
                          <h5 className="font-semibold text-xs text-primary">Prize Paid Out</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Disbursed {entry.paid_at ? `on ${formatDate(entry.paid_at)}` : 'successfully'}.
                          </p>
                        </div>
                      ) : entry.winner_status === 'rejected' ? (
                        <div className="text-center p-3 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-2">
                          <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
                          <h5 className="font-semibold text-xs text-destructive">Verification Issue</h5>
                          <p className="text-[11px] text-muted-foreground">
                            Scorecard image could not be verified. Please re-upload a clear photo.
                          </p>
                          <ProofUpload drawId={entry.draw_id} entryId={entry.id} onSuccess={fetchEntries} />
                        </div>
                      ) : null}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Winnings;
