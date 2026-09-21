import React, { useState, useEffect } from 'react';
import {
  Trophy, Zap, Play, CheckCircle2,
  AlertCircle, History, Calculator,
  RefreshCw, Layers, Loader2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  calculateDrawResults,
  finalizeAndPublishDraw,
  getLatestRollover
} from '../../lib/draw';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Draw, Winner } from '../../types';
import { supabase } from '../../lib/supabase';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

const AdminDraws: React.FC = () => {
  usePageTitle('Draw Management | Admin');
  const [mode, setMode] = useState<'random' | 'algorithmic'>('random');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [rollover, setRollover] = useState(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [drawHistory, setDrawHistory] = useState<Draw[]>([]);

  useEffect(() => {
    loadMetaData();
  }, []);

  const loadMetaData = async () => {
    const roll = await getLatestRollover();
    setRollover(roll);

    const { data } = await supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);
    setDrawHistory(data || []);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setMessage(null);
    try {
      // PRD Compliance: Random or Algorithmic simulation without arbitrary manual number override
      const results = await calculateDrawResults(mode);
      setSimulationResult(results);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Simulation failed' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handlePublish = async () => {
    if (!simulationResult) return;
    setIsPublishing(true);
    setMessage(null);
    try {
      await finalizeAndPublishDraw(simulationResult, mode);
      setMessage({ type: 'success', text: 'Official draw published successfully and notifications sent to winners!' });
      setSimulationResult(null);
      loadMetaData();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Publishing failed' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <Calculator className="w-4 h-4" />
              <span>Draw Operations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Draw Studio & Simulation
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Configure draw parameters, run test simulations, and publish official winning numbers per PRD specifications.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Current Jackpot Rollover
              </span>
              <span className="font-display font-black text-2xl text-secondary">
                {formatCurrency(rollover)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="space-y-6">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>Draw Mode Configuration</span>
              </h2>

              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground block">
                  Selection Method (PRD § 06)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('random')}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left flex flex-col justify-between",
                      mode === 'random'
                        ? "bg-primary/15 border-primary shadow-sm"
                        : "bg-surface-container-high border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <RefreshCw className={cn("w-5 h-5 mb-2", mode === 'random' ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <span className="font-display font-bold text-xs text-foreground block">Random Draw</span>
                      <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">Uniform 1–45</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('algorithmic')}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left flex flex-col justify-between",
                      mode === 'algorithmic'
                        ? "bg-secondary/15 border-secondary shadow-sm"
                        : "bg-surface-container-high border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Layers className={cn("w-5 h-5 mb-2", mode === 'algorithmic' ? "text-secondary" : "text-muted-foreground")} />
                    <div>
                      <span className="font-display font-bold text-xs text-foreground block">Algorithmic</span>
                      <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">Frequency Weighted</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pool & Rollover Breakdown */}
              <div className="p-4 rounded-2xl bg-surface-container-high border border-white/10 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Pool</span>
                  <span className="font-semibold text-foreground">{formatCurrency(175000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">5-Match Rollover</span>
                  <span className="font-semibold text-secondary">{formatCurrency(rollover)}</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
                  <span className="text-primary">Total Est. Pool</span>
                  <span className="text-foreground">{formatCurrency(175000 + rollover)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-50"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  <span>{isSimulating ? 'Simulating Draw...' : 'Simulate Draw Outcome'}</span>
                </button>

                {simulationResult && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md shadow-secondary/10 disabled:opacity-50"
                  >
                    {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    <span>Publish Official Draw</span>
                  </button>
                )}
              </div>
            </div>

            {/* Past Draws Mini-List */}
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 space-y-4">
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span>Recent Finalized Draws</span>
              </h3>

              <div className="space-y-3">
                {drawHistory.map((draw) => (
                  <div key={draw.id} className="p-3 bg-surface-container-high rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-foreground block">{draw.draw_month || 'Monthly Draw'}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{draw.draw_mode} Mode</span>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-bold text-foreground block">{formatCurrency(draw.prize_pool)}</span>
                      <div className="flex gap-1 justify-end mt-0.5">
                        {draw.winning_numbers?.slice(0, 3).map((n, i) => (
                          <span key={i} className="px-1 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-bold">{n}</span>
                        ))}
                        <span className="text-[9px] text-muted-foreground">..</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Results / Simulation Area */}
          <div className="lg:col-span-2 space-y-6">
            {message && (
              <div className={cn(
                "p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold",
                message.type === 'success' ? "bg-primary/10 border border-primary/20 text-primary" : "bg-destructive/10 border border-destructive/20 text-destructive"
              )}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {!simulationResult && !message && (
              <div className="bg-surface-container border border-dashed border-white/10 rounded-3xl p-16 text-center space-y-3">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
                <h3 className="font-display font-bold text-lg text-foreground">
                  Ready to Simulate
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click "Simulate Draw Outcome" to generate 5 winning numbers, match player scorecards, and test prize distributions before publishing.
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {simulationResult && (
                <motion.div
                  key="simulation"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Winning Numbers Banner */}
                  <div className="bg-surface-container border border-white/10 rounded-3xl p-8 text-center shadow-xl space-y-4">
                    <span className="text-xs uppercase font-semibold text-primary tracking-wider">
                      Simulated Winning Numbers (Descending Order)
                    </span>

                    <div className="flex justify-center flex-wrap gap-3 pt-2">
                      {simulationResult.winningNumbers.map((num: number, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-container-high border border-primary/30 flex items-center justify-center text-3xl sm:text-4xl font-display font-black text-primary shadow-lg shadow-primary/10"
                        >
                          {num}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* PRD Tier Splits (5-match 40%, 4-match 35%, 3-match 25%) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { tier: 5, pct: '40%', name: '5-Match Tier', count: simulationResult.tierBreakdown[5] },
                      { tier: 4, pct: '35%', name: '4-Match Tier', count: simulationResult.tierBreakdown[4] },
                      { tier: 3, pct: '25%', name: '3-Match Tier', count: simulationResult.tierBreakdown[3] }
                    ].map((t) => {
                      const prizePerWinner = t.count > 0 
                        ? (simulationResult.totalPool * (t.tier === 5 ? 0.4 : t.tier === 4 ? 0.35 : 0.25)) / t.count 
                        : 0;

                      return (
                        <div 
                          key={t.tier}
                          className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{t.name}</span>
                            <span className="text-primary font-bold">{t.pct}</span>
                          </div>
                          <p className="font-display font-black text-2xl text-foreground">
                            {t.count} <span className="text-xs text-muted-foreground font-normal">winner{t.count === 1 ? '' : 's'}</span>
                          </p>
                          <span className="text-[11px] text-muted-foreground block">
                            {t.count > 0 ? `${formatCurrency(prizePerWinner)} each` : (t.tier === 5 ? 'Jackpot rolls over' : 'No winners')}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Projected Rollover */}
                  <div className="bg-surface-container border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">5-Match Jackpot Rollover</span>
                      <span className="text-xs text-muted-foreground">
                        {simulationResult.tierBreakdown[5] === 0 ? 'Unclaimed 40% pool carries over to next draw' : 'Jackpot claimed! Rollover resets.'}
                      </span>
                    </div>
                    <span className="font-display font-bold text-xl text-secondary">
                      {formatCurrency(simulationResult.newRollover)}
                    </span>
                  </div>

                  {/* Simulated Winners List */}
                  <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-white/10">
                      <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-secondary" />
                        <span>Simulated Winners ({simulationResult.winners.length})</span>
                      </h3>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                      {simulationResult.winners.length === 0 ? (
                        <p className="p-8 text-center text-xs text-muted-foreground">No players matched 3 or more numbers in this simulation.</p>
                      ) : (
                        simulationResult.winners.map((winner: Winner, idx: number) => (
                          <div key={idx} className="p-4 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-foreground">
                                {winner.user_name?.charAt(0) || 'W'}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{winner.user_name}</p>
                                <span className="text-[10px] text-muted-foreground">{winner.match_count}-Match Tier</span>
                              </div>
                            </div>

                            <span className="font-display font-bold text-secondary text-sm">
                              {formatCurrency(winner.prize_amount)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDraws;
