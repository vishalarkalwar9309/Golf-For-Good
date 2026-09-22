import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { 
  Heart, 
  Trophy, 
  ArrowRight, 
  Target, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Globe, 
  TrendingUp, 
  HelpCircle, 
  Zap,
  Lock,
  Calendar,
  Check,
  Percent,
  Coins
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { usePageTitle } from '../hooks/usePageTitle';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { InteractiveScoreStory } from '../components/home/InteractiveScoreStory';
import { TextReveal, FadeSlide, StaggerContainer, StaggerItem } from '../components/ui/motion';
import type { Charity } from '../types';
import { getLatestRollover } from '../lib/draw';

const Home: React.FC = () => {
  usePageTitle('Your game can do more');
  const shouldReduceMotion = useReducedMotion();
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([]);
  const [latestRollover, setLatestRollover] = useState<number>(0);
  const [activeDrawMonth, setActiveDrawMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      try {
        const [rolloverAmount, { data: charitiesData }, { data: latestDrawData }] = await Promise.all([
          getLatestRollover().catch(() => 0),
          supabase.from('charities').select('*').limit(6),
          supabase.from('draws').select('draw_month, status').order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        if (!isMounted) return;

        setLatestRollover(rolloverAmount || 0);

        if (charitiesData && charitiesData.length > 0) {
          const featured = charitiesData.filter(c => c.featured);
          setFeaturedCharities(featured.length >= 3 ? featured.slice(0, 3) : charitiesData.slice(0, 3));
        }

        if (latestDrawData && (latestDrawData as any).draw_month) {
          setActiveDrawMonth((latestDrawData as any).draw_month);
        } else {
          const now = new Date();
          setActiveDrawMonth(now.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface overflow-hidden">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (Rich Editorial Composition) */}
      {/* ============================================================ */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-28 px-6 md:px-12 overflow-hidden">
        {/* Layered Organic Contours & Ambient Atmosphere */}
        <AbstractGraphic variant="hero-mesh" glowColor="emerald" />
        <AbstractGraphic variant="organic-topography" glowColor="lime" className="absolute top-10 right-0 w-[600px] h-[500px]" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Core Narrative & Value Proposition */}
            <div className="lg:col-span-7">
              {/* Live Draw & Pricing Ticker */}
              <FadeSlide direction="down" delay={0.08} distance={14}>
                <div className="flex flex-wrap items-center gap-2.5 mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border border-white/10 text-xs font-semibold backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                    <span className="text-[#CCFF00] font-mono tracking-wide uppercase">
                      {activeDrawMonth ? `${activeDrawMonth} Cycle` : 'Active Draw Cycle'}
                    </span>
                    {latestRollover > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-amber-300 font-bold font-mono">
                          {formatCurrency(latestRollover)} Rollover
                        </span>
                      </>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Monthly ₹499 &bull; Annual ₹4,999</span>
                  </div>
                </div>
              </FadeSlide>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-black tracking-tight text-white leading-[1.04] mb-6">
                <TextReveal text="Play your game." delay={0.12} /> <br />
                <TextReveal text="Make it count." highlightWords={['Make', 'it', 'count.']} delay={0.22} />
              </h1>

              {/* Supporting Copy */}
              <FadeSlide direction="up" delay={0.28} distance={16}>
                <p className="text-lg sm:text-xl text-on-surface-variant font-sans leading-relaxed max-w-2xl mb-8">
                  Enter your 18-hole Stableford scores from any certified course. Match monthly drawn numbers to win from the 50% subscriber prize pool, and automatically direct 10% to 100% of your contribution to verified UK charities.
                </p>
              </FadeSlide>

              {/* Action Buttons */}
              <FadeSlide direction="up" delay={0.34} distance={16}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md sm:max-w-none mb-10">
                  <Link to="/signup">
                    <Button variant="lime" size="lg" className="w-full sm:w-auto" icon={<ArrowRight className="w-5 h-5 text-[#08090D]" />}>
                      Join Golf For Good
                    </Button>
                  </Link>
                  <Link to="/how-it-works">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Explore the Mechanics
                    </Button>
                  </Link>
                </div>
              </FadeSlide>

              {/* Trust & Mechanics Micro-Pill Row */}
              <FadeSlide direction="up" delay={0.4} distance={16}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs text-on-surface-variant font-medium">PCI-DSS Secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="text-xs text-on-surface-variant font-medium">10% Min Charity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                    <span className="text-xs text-on-surface-variant font-medium">5 Retained Scores</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-on-surface-variant font-medium">3 Prize Tiers</span>
                  </div>
                </div>
              </FadeSlide>
            </div>

            {/* Right Column: Live Draw Chamber & Model Preview Card */}
            <div className="lg:col-span-5">
              <FadeSlide direction="left" delay={0.3} distance={20}>
                <div className="surface-editorial p-7 sm:p-8 relative overflow-hidden border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-5 border-b border-white/[0.08] mb-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono uppercase tracking-widest text-[#CCFF00] font-bold">
                        Draw Mechanics
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-white/60 bg-white/[0.05] px-2.5 py-1 rounded-md border border-white/[0.06]">
                      {activeDrawMonth}
                    </span>
                  </div>

                  {/* Chamber Visual: 5 Numbers Display */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2.5">
                      <span className="font-semibold text-white">5-Ball Draw Chamber</span>
                      <span className="text-[11px] text-emerald-400 font-mono">1–45 Stableford Pts</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[41, 38, 36, 32, 29].map((num, idx) => (
                        <div 
                          key={idx} 
                          className="h-14 rounded-2xl bg-gradient-to-b from-[#131B26] to-[#0A0E15] border border-white/10 flex flex-col items-center justify-center text-center group hover:border-[#CCFF00]/50 transition-colors"
                        >
                          <span className="text-[9px] font-mono text-on-surface-variant uppercase">Ball {idx + 1}</span>
                          <span className="font-display font-black text-lg text-white group-hover:text-[#CCFF00] transition-colors">
                            {num}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3 Prize Tiers Breakdown */}
                  <div className="space-y-3 mb-6">
                    <div className="p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-display font-bold text-xs flex items-center justify-center">
                          5
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">5 of 5 Match &bull; Jackpot</p>
                          <p className="text-[10px] text-amber-300/80">Carries forward if unclaimed</p>
                        </div>
                      </div>
                      <span className="font-display font-bold text-sm text-amber-400">40% Pool</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 font-display font-bold text-xs flex items-center justify-center">
                          4
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">4 of 5 Match &bull; Tier 2</p>
                          <p className="text-[10px] text-emerald-300/80">Equal split among winners</p>
                        </div>
                      </div>
                      <span className="font-display font-bold text-sm text-emerald-400">35% Pool</span>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-500/[0.07] border border-teal-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-300 font-display font-bold text-xs flex items-center justify-center">
                          3
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">3 of 5 Match &bull; Tier 3</p>
                          <p className="text-[10px] text-teal-300/80">Accessible regular reward</p>
                        </div>
                      </div>
                      <span className="font-display font-bold text-sm text-teal-400">25% Pool</span>
                    </div>
                  </div>

                  {/* Guaranteed Charity Allocation Bar */}
                  <div className="pt-4 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />
                        Charity Allocation
                      </span>
                      <span className="font-bold text-white">10% Min &rarr; 100% User Choice</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden flex">
                      <div className="h-full bg-rose-500 w-[15%]" title="10% Guaranteed Minimum" />
                      <div className="h-full bg-rose-400/40 w-[35%]" title="Up to 100% Discretionary" />
                      <div className="h-full bg-emerald-500/50 w-[50%]" title="50% Prize Pool" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant mt-1.5">
                      <span>10% Base</span>
                      <span className="text-rose-300 font-medium">Your chosen charity partner</span>
                      <span>50% Prize Pool</span>
                    </div>
                  </div>
                </div>
              </FadeSlide>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. PLAY / WIN / GIVE BACK (The 3 Pillars Architecture) */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative bg-[#090C12] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <FadeSlide direction="up" delay={0.05} className="max-w-3xl mb-16">
            <Badge variant="cream" size="md" className="mb-4">
              The Three Moves
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
              A smarter way to play, win, and give.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
              Every round you log connects your regular course performance to transparent cash prize draws and audited charitable impact.
            </p>
          </FadeSlide>

          <StaggerContainer staggerDelay={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PLAY Card */}
            <StaggerItem>
              <motion.div 
                whileHover={!shouldReduceMotion ? { y: -6, transition: { duration: 0.18 } } : undefined}
                whileTap={!shouldReduceMotion ? { scale: 0.99 } : undefined}
                className="surface-card p-8 sm:p-10 flex flex-col justify-between border-emerald-500/20 hover:border-emerald-500/40 transition-colors group h-full"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-8 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
                    01 &bull; PLAY
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    Log Any Regulation Round
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans mb-6">
                    Enter your 18-hole Stableford scores (1–45 points) from weekend games or club competitions. The platform automatically tracks and retains your 5 most recent rounds as your active draw numbers.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Active Entry:</span>
                  <span className="font-semibold text-emerald-400">5 Latest Rounds Retained</span>
                </div>
              </motion.div>
            </StaggerItem>

            {/* WIN Card */}
            <StaggerItem>
              <motion.div 
                whileHover={!shouldReduceMotion ? { y: -6, transition: { duration: 0.18 } } : undefined}
                whileTap={!shouldReduceMotion ? { scale: 0.99 } : undefined}
                className="surface-card p-8 sm:p-10 flex flex-col justify-between border-amber-500/20 hover:border-amber-500/40 transition-colors group h-full"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-8 border border-amber-500/20 group-hover:scale-105 transition-transform">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-2">
                    02 &bull; WIN
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    Monthly Community Draws
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans mb-6">
                    At the end of every calendar month, 5 independent numbers are generated. Match 3, 4, or 5 of your scores to win an equal share of the subscriber prize pool. Unclaimed 5-match jackpots roll over.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Prize Tiers:</span>
                  <span className="font-semibold text-amber-400">40% / 35% / 25% Split</span>
                </div>
              </motion.div>
            </StaggerItem>

            {/* GIVE BACK Card */}
            <StaggerItem>
              <motion.div 
                whileHover={!shouldReduceMotion ? { y: -6, transition: { duration: 0.18 } } : undefined}
                whileTap={!shouldReduceMotion ? { scale: 0.99 } : undefined}
                className="surface-card p-8 sm:p-10 flex flex-col justify-between border-rose-500/20 hover:border-rose-500/40 transition-colors group h-full"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-8 border border-rose-500/20 group-hover:scale-105 transition-transform">
                    <Heart className="w-6 h-6 fill-rose-400" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold block mb-2">
                    03 &bull; GIVE BACK
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    Guaranteed Impact Choice
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans mb-6">
                    Choose from verified charity partners including Macmillan Cancer Support, British Heart Foundation, and WWF UK. Direct a guaranteed 10% or increase up to 100% of your subscription anytime.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Allocation:</span>
                  <span className="font-semibold text-rose-400">10% to 100% Discretionary</span>
                </div>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE SCORE STORY (Educational Demo) */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <FadeSlide direction="up" delay={0.05} className="max-w-3xl mb-12">
            <Badge variant="lime" size="md" className="mb-4">
              Interactive Demonstration
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
              See how your rounds qualify.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant">
              Interact with the educational simulator below to see how five rounds become qualifying numbers and how your contribution funds both cash prizes and charity.
            </p>
          </FadeSlide>

          <FadeSlide direction="up" delay={0.15}>
            <InteractiveScoreStory />
          </FadeSlide>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. TRANSPARENT ECONOMICS & PLANS */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 bg-[#090C12] border-t border-white/[0.06] relative">
        <div className="max-w-7xl mx-auto">
          <FadeSlide direction="up" delay={0.05} className="max-w-3xl mb-16">
            <Badge variant="lime" size="md" className="mb-4">
              Transparent Economics
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
              Where your subscription goes.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant">
              No hidden fees, no opaque algorithms. Every rupee of subscriber revenue follows strict, provable allocations.
            </p>
          </FadeSlide>

          {/* Allocation Split Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="surface-card p-8 border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Prize Fund</span>
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-4xl font-display font-black text-white mb-2">50%</div>
                <h4 className="text-lg font-bold text-white mb-2">Monthly Member Prize Pool</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Half of all subscriber revenue is pooled and distributed directly to qualifying winners across 3 prize tiers each month.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-white/[0.06] text-xs font-semibold text-emerald-400">
                Independent Draw Verification
              </div>
            </div>

            <div className="surface-card p-8 border-rose-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">Charity Partner</span>
                  <Heart className="w-5 h-5 text-rose-400 fill-rose-400/30" />
                </div>
                <div className="text-4xl font-display font-black text-white mb-2">10%–100%</div>
                <h4 className="text-lg font-bold text-white mb-2">Guaranteed Direct Donation</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  A minimum 10% is guaranteed to your chosen partner. You can adjust your donation percentage anytime in your member dashboard.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-white/[0.06] text-xs font-semibold text-rose-400">
                Audited Donation Statements
              </div>
            </div>

            <div className="surface-card p-8 border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-white/60 uppercase">Platform & Ops</span>
                  <ShieldCheck className="w-5 h-5 text-white/60" />
                </div>
                <div className="text-4xl font-display font-black text-white mb-2">Balance</div>
                <h4 className="text-lg font-bold text-white mb-2">Operations & Infrastructure</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Funds secure cloud infrastructure, payment gateway processing, charity partner compliance, and real-time score verification.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-white/[0.06] text-xs font-semibold text-white/60">
                PCI-DSS Bank Grade Security
              </div>
            </div>
          </div>

          {/* Pricing Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Card */}
            <div className="surface-card p-8 sm:p-10 border-white/15 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-on-surface-variant">Monthly Plan</span>
                <div className="flex items-baseline gap-2 my-4">
                  <span className="text-4xl sm:text-5xl font-display font-black text-white">₹499</span>
                  <span className="text-sm text-on-surface-variant font-medium">/ month</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6">
                  Flexible monthly membership. Enter all draws, change your charity partner anytime, and cancel with one click.
                </p>
                <ul className="space-y-3 text-xs text-on-surface-variant mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Eligible for all 12 monthly community draws</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Retains 5 active Stableford scores (1–45 pts)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Guaranteed 10% to 100% charity allocation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Instant self-service cancellation anytime</span>
                  </li>
                </ul>
              </div>
              <Link to="/signup">
                <Button variant="outline" size="md" className="w-full">
                  Choose Monthly
                </Button>
              </Link>
            </div>

            {/* Annual Card */}
            <div className="surface-editorial p-8 sm:p-10 border-emerald-500/40 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#CCFF00] text-[#08090D]">
                  Save ~17% (2 Months Free)
                </span>
              </div>
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Annual Plan</span>
                <div className="flex items-baseline gap-2 my-4">
                  <span className="text-4xl sm:text-5xl font-display font-black text-white">₹4,999</span>
                  <span className="text-sm text-on-surface-variant font-medium">/ year</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-6">
                  Best value. Full 12-month membership for the price of 10 months, maximizing your long-term charity contribution.
                </p>
                <ul className="space-y-3 text-xs text-on-surface-variant mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                    <span>Full year coverage &bull; 12 consecutive draw cycles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                    <span>Continuous rollover jackpot eligibility</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                    <span>Direct charity impact amplified all year</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#CCFF00] flex-shrink-0" />
                    <span>2 Months Free compared to monthly billing</span>
                  </li>
                </ul>
              </div>
              <Link to="/signup">
                <Button variant="lime" size="md" className="w-full" icon={<ArrowRight className="w-4 h-4 text-[#08090D]" />}>
                  Choose Annual
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. CHARITY IMPACT & FEATURED CHARITIES */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 bg-background relative overflow-hidden">
        <AbstractGraphic variant="contour-blob" glowColor="coral" className="absolute -right-20 -bottom-20 w-80 h-80 opacity-20" />

        <div className="max-w-7xl mx-auto relative z-10">
          <FadeSlide direction="up" delay={0.05} className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <Badge variant="coral" size="md" className="mb-4">
                Partner Organizations
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-2">
                Featured Charities
              </h2>
              <p className="text-base text-on-surface-variant">
                Select from verified partner organizations doing vital work across health, community, and the environment.
              </p>
            </div>
            <Link to="/charities">
              <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                View All Charities
              </Button>
            </Link>
          </FadeSlide>

          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCharities.map((charity) => (
              <StaggerItem key={charity.id}>
                <motion.div
                  whileHover={!shouldReduceMotion ? { y: -6, transition: { duration: 0.18 } } : undefined}
                  className="surface-card overflow-hidden flex flex-col justify-between group transition-colors hover:border-white/20 h-full rounded-2xl"
                >
                  <div>
                    <div className="h-44 bg-slate-900 relative overflow-hidden">
                      {charity.image_url ? (
                        <img
                          src={charity.image_url}
                          alt={charity.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-slate-900 flex items-center justify-center">
                          <Heart className="w-12 h-12 text-white/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
                          {charity.category || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">
                        {charity.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-6 font-sans">
                        {charity.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-0 border-t border-white/[0.06] flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Total Impact</span>
                      <span className="font-display font-bold text-sm text-emerald-400">
                        {formatCurrency(charity.total_raised || 0)}
                      </span>
                    </div>
                    <Link
                      to={`/charities/${charity.slug}`}
                      className="text-xs font-semibold text-white hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      View Partner <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. PLATFORM TRUST & INTEGRITY */}
      {/* ============================================================ */}
      <section className="py-20 px-6 md:px-12 bg-[#080B10] border-t border-white/[0.06] relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Lock className="w-6 h-6 text-emerald-400 mb-3" />
              <h4 className="font-display font-bold text-white text-sm mb-1">Row-Level Security</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Supabase database isolation guarantees that member data, scores, and charity allocations remain strictly private.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Award className="w-6 h-6 text-amber-400 mb-3" />
              <h4 className="font-display font-bold text-white text-sm mb-1">Audited Draw Proofs</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Draw executions publish cryptographic winner verification proofs stored in tamper-proof public storage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Zap className="w-6 h-6 text-[#CCFF00] mb-3" />
              <h4 className="font-display font-bold text-white text-sm mb-1">Instant Cancellation</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Self-service subscription management in your dashboard. Cancel anytime with zero lock-in or penalties.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Target className="w-6 h-6 text-teal-400 mb-3" />
              <h4 className="font-display font-bold text-white text-sm mb-1">Stableford Standard</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Scores follow standard 1–45 point constraints with single round per date validation to preserve fair play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. FINAL HIGH-IMPACT CALL TO ACTION */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden border-t border-white/[0.08] bg-[#07090E]">
        <AbstractGraphic variant="hero-mesh" glowColor="lime" className="opacity-30" />

        <FadeSlide direction="up" delay={0.08} className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="lime" size="md" className="mb-6">
            Join the Community
          </Badge>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight text-white mb-6 leading-tight">
            Ready to make your rounds count?
          </h2>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            Choose your charity partner, submit your latest rounds, and join the monthly community draw today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="lime" size="lg" icon={<ArrowRight className="w-5 h-5 text-[#08090D]" />}>
                Join Golf For Good
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg">
                Explore Detailed Rules
              </Button>
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant/70 mt-8">
            Monthly ₹499 &bull; Annual ₹4,999 (2 Months Free) &bull; Cancel anytime via dashboard
          </p>
        </FadeSlide>
      </section>
    </div>
  );
};

export default Home;
