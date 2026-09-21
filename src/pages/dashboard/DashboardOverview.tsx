import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, Target, Heart, Zap, Plus, History, 
  Award, Calendar, ChevronRight, 
  AlertCircle, CheckCircle2, Info, Star, ArrowRight, Lock,
  Sparkles, ExternalLink
} from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { Score, Charity } from '../../types';

const DashboardOverview: React.FC = () => {
  const { user, profile } = useAuth();
  const { subscription, isActive, isPremium, loading: subLoading } = useSubscription();
  usePageTitle('Member Dashboard');
  const [scores, setScores] = useState<Score[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [latestDraw, setLatestDraw] = useState<any>(null);
  const [latestEntry, setLatestEntry] = useState<any>(null);
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [newScore, setNewScore] = useState({ 
    points: '', 
    course: '', 
    date: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch scores
      const { data: scoreData } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(5);
      
      setScores(scoreData || []);

      // 2. Fetch charities
      const { data: charityData } = await supabase
        .from('charities')
        .select('*');
      
      setCharities(charityData || []);

      // 3. Fetch latest published draw
      const { data: drawData } = await supabase
        .from('draws')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLatestDraw(drawData);

      // 4. Fetch user's entry for this draw
      if (drawData) {
        const { data: entryData } = await supabase
          .from('draw_entries')
          .select('*')
          .eq('draw_id', drawData.id)
          .eq('user_id', user?.id)
          .maybeSingle();
        setLatestEntry(entryData);
      }

      // 5. Fetch featured charities for discovery
      const { data: featuredData } = await supabase
        .from('charities')
        .select('*')
        .eq('featured', true)
        .limit(3);
      setFeaturedCharities(featuredData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    if (!isPremium) {
      setMessage({ type: 'error', text: 'An active membership is required to submit scores for the monthly draw.' });
      return;
    }

    const points = parseInt(newScore.points);
    if (isNaN(points) || points < 1 || points > 45) {
      setMessage({ type: 'error', text: 'Stableford points must be strictly between 1 and 45.' });
      return;
    }

    if (!newScore.course.trim()) {
      setMessage({ type: 'error', text: 'Please enter the course name.' });
      return;
    }

    if (!newScore.date) {
      setMessage({ type: 'error', text: 'Please select the date of your round.' });
      return;
    }

    // Check duplicate score date (PRD requirement: only one score per date)
    const formattedDate = newScore.date.split('T')[0];
    const duplicate = scores.find(s => s.date.split('T')[0] === formattedDate);
    if (duplicate) {
      setMessage({ 
        type: 'error', 
        text: `A score for ${formattedDate} already exists (${duplicate.course_name}: ${duplicate.stableford_points} pts). Only one score per date is permitted.` 
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // 1. Get current scores to enforce 5-score retention
      const { data: currentScores } = await supabase
        .from('scores')
        .select('id, date')
        .eq('user_id', user.id)
        .order('date', { ascending: true }); // Oldest first

      if (currentScores && currentScores.length >= 5) {
        const toDeleteCount = currentScores.length - 4;
        const idsToDelete = currentScores.slice(0, toDeleteCount).map(s => s.id);
        await supabase.from('scores').delete().in('id', idsToDelete);
      }

      const { error } = await supabase
        .from('scores')
        .insert([
          {
            user_id: user.id,
            stableford_points: points,
            course_name: newScore.course.trim(),
            date: formattedDate,
          }
        ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Round recorded! Your draw entry numbers have been updated.' });
      setNewScore({ points: '', course: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to record score.' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeCharity = charities.find(c => c.id === (subscription?.charity_id || profile?.selected_charity_id));

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const membershipPlanLabel = subscription?.plan_type === 'yearly'
    ? 'Annual Member'
    : subscription?.plan_type === 'monthly'
    ? 'Monthly Member'
    : subscription?.plan_type === 'free'
    ? 'Community Member'
    : 'Member';

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-40" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>{isActive ? `${membershipPlanLabel} Active` : 'Membership Inactive'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-foreground">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-xl">
              Track your latest Stableford rounds, monitor your upcoming monthly draw numbers, and see the impact of your charitable giving.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Active Draw</span>
                <span className="text-sm font-display font-bold text-foreground">{latestDraw?.draw_month || 'Upcoming'}</span>
              </div>
            </div>

            <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
              <Trophy className="w-5 h-5 text-secondary" />
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Prize Pool</span>
                <span className="text-sm font-display font-bold text-secondary">
                  {latestDraw ? formatCurrency(latestDraw.prize_pool) : 'Guaranteed Pool'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Feature: Draw Numbers & Current Status */}
        <div className="bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Star className="w-4 h-4" />
                <span>Monthly Draw Numbers</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">
                Your 5 Official Qualifying Numbers
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Generated from your 5 most recent rounds. Sorted descending (highest score first) per PRD draw rules.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {scores.length >= 5 ? (
                  scores.slice(0, 5).map((s) => (
                    <div 
                      key={s.id} 
                      className="w-12 h-12 rounded-xl bg-surface-container-high border border-primary/30 flex items-center justify-center font-display font-black text-lg text-primary shadow-sm"
                    >
                      {s.stableford_points}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface-container-high px-4 py-2.5 rounded-xl border border-white/10">
                    <Target className="w-4 h-4 text-primary" />
                    <span>{scores.length}/5 scores recorded ({5 - scores.length} more needed for complete entry)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:w-96 shrink-0">
              <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Total Impact
                </span>
                <span className="text-2xl font-display font-bold text-primary">
                  {formatCurrency(profile?.total_impact || 0)}
                </span>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                  Draw Status
                </span>
                <span className="text-sm font-display font-bold text-foreground">
                  {isPremium ? (scores.length >= 5 ? 'Eligible' : 'Scores Needed') : 'Membership Required'}
                </span>
              </div>

              <Link 
                to="/dashboard/winnings" 
                className="col-span-2 bg-surface-container-low hover:bg-surface-container-high p-3 rounded-2xl border border-white/5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-secondary" />
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Winnings & Verification
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Performance & Charity Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Performance & Log Round */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  <span>Recent Stableford Scores</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest 5 scores are kept and used for the monthly draw.
                </p>
              </div>

              <Link 
                to="/dashboard/scores" 
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Manage all scores</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Score List */}
              <div className="space-y-3">
                {scores.length > 0 ? (
                  scores.map((score) => (
                    <div 
                      key={score.id}
                      className="bg-surface-container border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-bold text-xl text-primary shrink-0">
                          {score.stableford_points}
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-sm text-foreground">{score.course_name}</h4>
                          <p className="text-xs text-muted-foreground">{formatDate(score.date)}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase">
                        Pts
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyState 
                    icon={Target}
                    title="No Scores Logged Yet"
                    description="Enter your recent Stableford rounds to populate your 5 monthly draw numbers."
                    className="py-10 bg-surface-container border border-white/10 rounded-2xl"
                  />
                )}
              </div>

              {/* Log Round Card */}
              <div className="bg-surface-container border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                {!isPremium && (
                  <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-base text-foreground mb-1">Active Membership Required</h3>
                    <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                      Join a plan to record your Stableford rounds and enter monthly cash draws.
                    </p>
                    <Link
                      to="/dashboard/subscription"
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md"
                    >
                      View Membership Plans
                    </Link>
                  </div>
                )}

                <div>
                  <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5 text-primary" />
                    <span>Log New Round</span>
                  </h3>

                  {message && (
                    <div className={cn(
                      "p-3 rounded-xl mb-4 flex items-start gap-2.5 text-xs font-medium",
                      message.type === 'success' 
                        ? "bg-primary/10 border border-primary/20 text-primary" 
                        : "bg-destructive/10 border border-destructive/20 text-destructive"
                    )}>
                      {message.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <span>{message.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleScoreSubmit} className="space-y-3.5">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Stableford Points (1–45)
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="45"
                        placeholder="e.g. 36"
                        value={newScore.points}
                        onChange={(e) => setNewScore({ ...newScore, points: e.target.value })}
                        disabled={!isPremium}
                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Date of Round
                      </label>
                      <input 
                        type="date"
                        value={newScore.date}
                        onChange={(e) => setNewScore({ ...newScore, date: e.target.value })}
                        disabled={!isPremium}
                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Course Name
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Royal Melbourne Golf Club"
                        value={newScore.course}
                        onChange={(e) => setNewScore({ ...newScore, course: e.target.value })}
                        disabled={!isPremium}
                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !isPremium}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/10 disabled:opacity-50 mt-2"
                    >
                      {submitting ? 'Recording Score...' : 'Record Round'}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>Only one round per date is permitted.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charity Impact Column */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                <span>Your Charity</span>
              </h2>

              <Link 
                to="/dashboard/charity" 
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change partner
              </Link>
            </div>

            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 space-y-6">
              {activeCharity ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-white/10 p-2 flex items-center justify-center font-display font-bold text-lg text-primary overflow-hidden shrink-0">
                      {activeCharity.logo_url ? (
                        <img src={activeCharity.logo_url} alt={activeCharity.name} className="w-full h-full object-contain" />
                      ) : (
                        activeCharity.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-primary block">
                        {activeCharity.category}
                      </span>
                      <h3 className="font-display font-bold text-lg text-foreground leading-snug">
                        {activeCharity.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {activeCharity.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    <div className="bg-surface-container-low p-3.5 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
                        Your Giving
                      </span>
                      <span className="font-display font-bold text-lg text-primary">
                        {formatCurrency(profile?.total_impact || 0)}
                      </span>
                    </div>

                    <div className="bg-surface-container-low p-3.5 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
                        Total Raised
                      </span>
                      <span className="font-display font-bold text-lg text-foreground">
                        {formatCurrency(activeCharity.total_raised || 0)}
                      </span>
                    </div>
                  </div>

                  <Link 
                    to="/dashboard/charity" 
                    className="w-full py-3 rounded-xl bg-surface-container-high border border-white/10 text-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors"
                  >
                    <span>Manage Giving & Contribution %</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <div className="text-center py-6">
                  <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <h4 className="font-display font-bold text-base text-foreground mb-1">No Charity Selected</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Choose a charity partner to receive your monthly membership contribution.
                  </p>
                  <Link
                    to="/dashboard/charity"
                    className="inline-block px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
                  >
                    Choose a Charity
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Membership Tile */}
            <div className="bg-surface-container border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Membership Standing
                </span>
                <span className="font-display font-bold text-sm text-foreground">
                  {membershipPlanLabel}
                </span>
              </div>

              <Link 
                to="/dashboard/subscription" 
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View plan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Charities Discovery */}
        {featuredCharities.length > 0 && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Explore Verified Charity Partners
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  See the organizations our community supports through every round of golf played.
                </p>
              </div>

              <Link 
                to="/charities" 
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View all charities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCharities.map((charity) => (
                <Link 
                  key={charity.id}
                  to={`/charities/${charity.slug}`}
                  className="group bg-surface-container border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-primary/30 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-semibold text-primary">
                        {charity.category}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {charity.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {charity.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total Impact</span>
                    <span className="font-display font-bold text-foreground">
                      {formatCurrency(charity.total_raised)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
