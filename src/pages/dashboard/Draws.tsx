import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Award, Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthProvider';
import { useSubscription } from '../../hooks/useSubscription';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { Draw } from '../../types';

const DrawsHistory: React.FC = () => {
  usePageTitle('Monthly Draws');
  const { user } = useAuth();
  const { isActive, isPremium, loading: subLoading } = useSubscription();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDraws(data || []);
    } catch (err) {
      console.error('Error fetching draws:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWinner = (draw: Draw) => {
    return draw.winners?.some((w: any) => w.user_id === user?.id) || false;
  };

  const getWinnerData = (draw: Draw) => {
    return draw.winners?.find((w: any) => w.user_id === user?.id);
  };

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <Trophy className="w-4 h-4" />
              <span>Community Prize Draws</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Monthly Draws & Official Results
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Published results of the monthly cash draws. Winning numbers are drawn from 1–45 and matched against players' 5 active Stableford scores.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {!isPremium && (
            <div className="absolute inset-0 z-30 bg-background/80 backdrop-blur-md flex items-center justify-center rounded-3xl border border-white/10 p-6">
              <div className="text-center max-w-sm">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  Membership Required
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mb-6">
                  Detailed draw results, match breakdowns, and prize eligibility require an active membership.
                </p>
                <Link
                  to="/dashboard/subscription"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-lg shadow-primary/20"
                >
                  <span>Activate Membership</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Draws List */}
          <div className="lg:col-span-2 space-y-5">
            {draws.map((draw, idx) => {
              const won = isWinner(draw);
              const winData = getWinnerData(draw);

              return (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "bg-surface-container border rounded-3xl p-6 transition-all relative overflow-hidden",
                    won ? "border-secondary/40 bg-secondary/5 shadow-lg shadow-secondary/10" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-display font-bold shadow-sm",
                        won ? "bg-secondary text-secondary-foreground" : "bg-surface-container-high text-primary border border-white/10"
                      )}>
                        {won ? <Award className="w-7 h-7" /> : <Calendar className="w-7 h-7" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-xl text-foreground">
                            {draw.draw_month || `Draw ${draw.draw_year || ''}`}
                          </h3>
                          {won && (
                            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                              Winner!
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Conducted on {formatDate(draw.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Total Prize Pool
                        </span>
                        <span className="text-xl font-display font-bold text-foreground">
                          {formatCurrency(draw.prize_pool)}
                        </span>
                      </div>

                      <div className="w-px h-8 bg-white/10" />

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Your Status
                        </span>
                        {won && winData ? (
                          <div>
                            <span className="font-display font-black text-xl text-secondary">
                              {formatCurrency(winData.prize_amount)}
                            </span>
                            <span className="text-[10px] text-secondary block font-semibold">
                              Tier {winData.match_count}-Match
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No Matches
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Drawn Numbers Bar */}
                  {draw.winning_numbers && draw.winning_numbers.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">Winning Numbers:</span>
                        <div className="flex items-center gap-1.5">
                          {draw.winning_numbers.map((num: number, nIdx: number) => (
                            <div 
                              key={nIdx}
                              className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/20 flex items-center justify-center font-display font-bold text-xs text-primary"
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>

                      <span className="text-[11px] text-muted-foreground">
                        Mode: {draw.mode === 'algorithmic' ? 'Weighted Algorithmic' : 'Random Draw'}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {draws.length === 0 && (
              <EmptyState 
                icon={Trophy}
                title="No Draws Finalized Yet"
                description="The upcoming monthly draw is scheduled for the end of the month. Ensure your 5 Stableford scores are recorded to enter!"
                className="py-16 bg-surface-container border border-white/10 rounded-3xl"
              />
            )}
          </div>

          {/* Right Column: Rules & Info */}
          <div className="space-y-6">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 space-y-5">
              <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Draw Rules (PRD Compliance)</span>
              </h3>

              <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    1
                  </div>
                  <p>
                    <strong className="text-foreground">Eligibility:</strong> Must have an active membership and at least 1 valid Stableford round logged.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    2
                  </div>
                  <p>
                    <strong className="text-foreground">5-Number Entry:</strong> Your 5 most recent scores are sorted descending and matched against the 5 winning numbers drawn.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    3
                  </div>
                  <p>
                    <strong className="text-foreground">Prize Tiers:</strong>
                    <br />
                    • 5 Matches: 40% of prize pool (Jackpot rols over if unclaimed)
                    <br />
                    • 4 Matches: 35% of prize pool (Split equally among winners)
                    <br />
                    • 3 Matches: 25% of prize pool (Split equally among winners)
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">
                    4
                  </div>
                  <p>
                    <strong className="text-foreground">Verification:</strong> Winners must upload a verified scorecard within 48 hours to claim payouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawsHistory;
