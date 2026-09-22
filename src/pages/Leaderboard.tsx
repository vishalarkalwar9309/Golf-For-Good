import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Heart, Search, Award, Medal, Users, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';
import { usePageTitle } from '../hooks/usePageTitle';
import EmptyState from '../components/ui/EmptyState';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';

const Leaderboard: React.FC = () => {
  usePageTitle('Community Leaderboard');
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    let isCancelled = false;

    // Safety watchdog: never leave spinner running longer than 6 seconds
    const watchdog = setTimeout(() => {
      if (!isCancelled) {
        setLoading(false);
      }
    }, 6000);

    try {
      const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
      const { data: scores, error: sError } = await supabase.from('scores').select('*');

      if (pError && pError.code !== 'PGRST116') {
        console.warn('Profiles query notice:', pError.message);
      }
      if (sError && sError.code !== 'PGRST116') {
        console.warn('Scores query notice:', sError.message);
      }

      const leaderboardData = (profiles || []).map(p => {
        const userScores = (scores || [])
          .filter(s => s.user_id === p.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        const avg = userScores.length > 0 
          ? userScores.reduce((acc, s) => acc + s.stableford_points, 0) / userScores.length 
          : 0;
        
        return { ...p, avgPoints: avg, roundsCount: userScores.length };
      })
      .filter(p => p.roundsCount > 0)
      .sort((a, b) => b.avgPoints - a.avgPoints);

      if (!isCancelled) {
        setLeaders(leaderboardData);
      }
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      if (!isCancelled) {
        setError(err.message || 'Could not load player standings.');
      }
    } finally {
      clearTimeout(watchdog);
      if (!isCancelled) {
        setLoading(false);
      }
    }
  };

  const filteredLeaders = leaders.filter(l => 
    l.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Building the leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-20 px-6">
      <AbstractGraphic variant="hero-mesh" className="opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Player Standings</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-bold tracking-tight text-foreground">
            Community Leaderboard
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Rankings are computed from the average of each player's <strong className="text-foreground">5 most recent Stableford rounds</strong>.
          </p>
        </div>

        {error ? (
          <div className="surface-card p-16 text-center max-w-lg mx-auto border border-rose-500/20">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">We couldn't load the leaderboard</h3>
            <p className="text-xs text-on-surface-variant mb-6">{error}</p>
            <button 
              onClick={fetchLeaderboard} 
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-semibold text-white inline-flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        ) : leaders.length === 0 ? (
          <EmptyState 
            icon={Users}
            title="Scores will appear here as players start recording rounds."
            description="Log your Stableford scores in your dashboard to be ranked on the community leaderboard."
            action={{ label: "Join Golf For Good", onClick: () => window.location.href = '/signup' }}
            className="bg-surface-container border border-white/10 rounded-3xl py-16"
          />
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            <div className={cn(
              "grid gap-6 items-end justify-center pt-6",
              filteredLeaders.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : 
              filteredLeaders.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : 
              "grid-cols-1 sm:grid-cols-3"
            )}>
              {[1, 0, 2].map((leaderIdx, displayIdx) => {
                const l = filteredLeaders[leaderIdx];
                if (!l) return null;
                const isFirst = leaderIdx === 0;
                const medalColors = isFirst 
                  ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20" 
                  : leaderIdx === 1 
                  ? "bg-surface-container-highest text-foreground" 
                  : "bg-amber-700/40 text-amber-200";

                return (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: displayIdx * 0.1 }}
                    className={cn(
                      "bg-surface-container border rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xl transition-all",
                      isFirst 
                        ? "border-secondary/40 sm:-translate-y-4 ring-1 ring-secondary/30" 
                        : "border-white/10"
                    )}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-surface-container-high border border-white/10 mx-auto mb-4 flex items-center justify-center font-display font-bold text-2xl text-primary relative">
                      {l.full_name?.charAt(0) || 'P'}
                      <div className={cn(
                        "absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                        medalColors
                      )}>
                        {leaderIdx + 1}
                      </div>
                    </div>

                    <h3 className="font-display font-bold text-lg text-foreground truncate mb-1">
                      {l.full_name || 'Anonymous Golfer'}
                    </h3>

                    <div className="flex items-center justify-center gap-1.5 mb-6">
                      <span className="text-2xl font-display font-black text-primary">
                        {l.avgPoints.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">avg pts</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase">Rounds</span>
                        <span className="font-semibold text-foreground">{l.roundsCount}/5</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase">Impact</span>
                        <span className="font-semibold text-primary">{formatCurrency(l.total_impact || 0)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Remaining Ranks Table */}
            <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-white/10">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search player name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-muted-foreground bg-surface-container-high/50 tracking-wider">
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Player</th>
                      <th className="px-6 py-4">Average Score</th>
                      <th className="px-6 py-4">Rounds Logged</th>
                      <th className="px-6 py-4 text-right">Charity Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeaders.slice(3).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No additional players ranked.
                        </td>
                      </tr>
                    ) : (
                      filteredLeaders.slice(3).map((leader, idx) => (
                        <tr key={leader.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-display font-bold text-sm text-muted-foreground">
                              #{idx + 4}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-primary shrink-0">
                                {leader.full_name?.charAt(0) || 'P'}
                              </div>
                              <span className="font-semibold text-foreground text-sm">
                                {leader.full_name || 'Anonymous Golfer'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-display font-black text-base text-primary">
                              {leader.avgPoints.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">pts</span>
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-foreground font-medium">{leader.roundsCount}/5 rounds</span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <span className="font-semibold text-primary">
                              {formatCurrency(leader.total_impact || 0)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
