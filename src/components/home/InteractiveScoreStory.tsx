import React, { useState } from 'react';
import { Target, Trophy, Heart, Sparkles, RefreshCw, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

/**
 * Educational Interactive Example demonstrating the Golf For Good cycle:
 * PLAY (Stableford scoring) -> WIN (Matching against monthly draw) -> GIVE BACK (Charity allocation).
 * Explicitly labeled as a non-live educational simulation.
 */
export const InteractiveScoreStory: React.FC = () => {
  // Sample educational scores representing 5 latest rounds
  const [sampleScores, setSampleScores] = useState<number[]>([38, 36, 40, 34, 37]);
  const [charityPercentage, setCharityPercentage] = useState<number>(15);

  // Sample static draw numbers for matching demonstration
  const sampleDrawNumbers = [40, 38, 36, 31, 28];

  // The 5 qualifying scores are sorted descending per PRD draw rules
  const sortedScores = [...sampleScores].sort((a, b) => b - a);

  // Calculate matches against the sample draw
  const matches = sortedScores.filter(score => sampleDrawNumbers.includes(score));
  const matchCount = matches.length;

  const presets = [
    { label: 'Steady Game (3 Matches)', scores: [38, 36, 40, 33, 29] },
    { label: 'Hot Streak (4 Matches)', scores: [40, 38, 36, 31, 27] },
    { label: 'Club Round', scores: [35, 34, 37, 39, 32] }
  ];

  const handleScoreChange = (index: number, delta: number) => {
    setSampleScores(prev => {
      const next = [...prev];
      const updated = Math.min(45, Math.max(1, next[index] + delta));
      next[index] = updated;
      return next;
    });
  };

  return (
    <div className="surface-editorial p-6 sm:p-10 md:p-12 relative overflow-hidden border border-white/10">
      {/* Educational Notice Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08] mb-8">
        <div className="flex items-center gap-2.5">
          <Badge variant="lime" size="sm" dot>
            Interactive Example
          </Badge>
          <span className="text-xs text-on-surface-variant font-medium">
            Educational demo &bull; Not a live draw
          </span>
        </div>
        <div className="text-xs text-on-surface-variant/80 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>Simulated mechanics — see how the 3 pillars connect</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: PLAY & WIN (Simulated Scoring & Matching) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: PLAY (Log 5 Scores) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 font-display font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  PLAY: Your 5 Latest Stableford Rounds
                </h3>
              </div>
              <span className="text-xs text-on-surface-variant">Tap arrows to adjust</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Every round you play is logged as an 18-hole Stableford score (1–45 pts). Your official qualifying entry always uses your 5 most recent rounds.
            </p>

            {/* 5 Score Cards */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {sampleScores.map((score, i) => (
                <div 
                  key={i} 
                  className="bg-[#0A0D14] border border-white/10 hover:border-emerald-500/40 rounded-xl p-2.5 sm:p-3 text-center transition-all group"
                >
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                    Round {i + 1}
                  </span>
                  <div className="font-display font-black text-xl sm:text-2xl text-white my-1 group-hover:text-emerald-400 transition-colors">
                    {score}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleScoreChange(i, -1)}
                      className="w-5 h-5 rounded bg-white/[0.05] hover:bg-white/10 text-xs text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                      title="Decrease score"
                      aria-label="Decrease score"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleScoreChange(i, 1)}
                      className="w-5 h-5 rounded bg-white/[0.05] hover:bg-white/10 text-xs text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
                      title="Increase score"
                      aria-label="Increase score"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mr-1">
                Try scenarios:
              </span>
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSampleScores(preset.scores)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-on-surface-variant hover:text-white border border-white/10 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: WIN (Simulated Matching) */}
          <div className="pt-6 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-display font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-display font-bold text-lg text-white">
                  WIN: Matching Against Sample Draw
                </h3>
              </div>
              <Badge variant={matchCount >= 3 ? 'gold' : 'neutral'} size="sm">
                {matchCount >= 5 ? '5 Matches (Jackpot Tier)' : matchCount === 4 ? '4 Matches (Tier 2)' : matchCount === 3 ? '3 Matches (Tier 3)' : `${matchCount} Matches (Needs 3)`}
              </Badge>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              In the official monthly draw, 5 numbers are independently drawn. Your sorted scores are compared against them.
            </p>

            <div className="bg-[#0A0D14] rounded-2xl p-4 border border-white/10 space-y-4">
              {/* Sample Draw Numbers */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block mb-2">
                  Sample Official Draw Numbers
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                  {sampleDrawNumbers.map((num, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-display font-bold text-sm sm:text-base border transition-all",
                        sortedScores.includes(num)
                          ? "bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20 scale-105"
                          : "bg-white/[0.04] text-white/70 border-white/10"
                      )}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              {/* Player Sorted Entry */}
              <div className="pt-3 border-t border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 block mb-2">
                  Your Sorted Draw Entry (Highest to Lowest)
                </span>
                <div className="flex items-center gap-2 sm:gap-3">
                  {sortedScores.map((score, i) => {
                    const isMatched = sampleDrawNumbers.includes(score);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-display font-bold text-sm sm:text-base border transition-all",
                          isMatched
                            ? "bg-emerald-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-400/20 scale-105"
                            : "bg-white/[0.04] text-white/70 border-white/10"
                        )}
                      >
                        {score}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: GIVE BACK (Charity Impact Slider & Summary) */}
        <div className="lg:col-span-5 bg-[#090C12] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 font-display font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-display font-bold text-lg text-white">
                GIVE BACK: Your Charitable Split
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              A minimum of 10% of your membership fee goes straight to your designated charity partner. You can voluntarily increase this up to 100% anytime.
            </p>

            {/* Slider Control */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Your Selected Charity Allocation
                </span>
                <span className="font-display font-black text-xl text-rose-400">
                  {charityPercentage}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={charityPercentage}
                onChange={(e) => setCharityPercentage(Number(e.target.value))}
                className="w-full accent-rose-400 h-2 bg-white/10 rounded-lg cursor-pointer"
                aria-label="Charity contribution percentage"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                <span>10% (Platform Min)</span>
                <span>50% (Generous)</span>
                <span>100% (Pure Philanthropy)</span>
              </div>
            </div>

            {/* Distribution Visualizer */}
            <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                  Your Chosen Charity
                </span>
                <span className="font-display font-bold text-white">
                  {charityPercentage}% of fee
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Community Prize Pool
                </span>
                <span className="font-display font-bold text-white">
                  50% of fee pool
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Every round you play on the course powers real-world social impact and community rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveScoreStory;
