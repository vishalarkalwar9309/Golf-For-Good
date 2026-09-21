import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Trophy, 
  ArrowRight, 
  Target, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
  Globe,
  TrendingUp,
  HelpCircle,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { usePageTitle } from '../hooks/usePageTitle';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { InteractiveScoreStory } from '../components/home/InteractiveScoreStory';
import type { Charity } from '../types';
import { getLatestRollover } from '../lib/draw';

const Home: React.FC = () => {
  usePageTitle('Your game can do more');
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([]);
  const [latestRollover, setLatestRollover] = useState<number>(0);
  const [activeDrawMonth, setActiveDrawMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [rolloverAmount, { data: charitiesData }, { data: latestDrawData }] = await Promise.all([
          getLatestRollover(),
          supabase.from('charities').select('*').eq('featured', true).limit(3),
          supabase.from('draws').select('draw_month, status').order('created_at', { ascending: false }).limit(1).maybeSingle()
        ]);

        setLatestRollover(rolloverAmount || 0);
        setFeaturedCharities(charitiesData || []);
        if (latestDrawData) {
          setActiveDrawMonth(latestDrawData.draw_month);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface overflow-hidden">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (Asymmetric Editorial Composition) */}
      {/* ============================================================ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6 md:px-12 overflow-hidden">
        {/* Layered Organic Contours & Glow */}
        <AbstractGraphic variant="hero-mesh" glowColor="emerald" />
        <AbstractGraphic variant="organic-topography" glowColor="lime" className="absolute top-10 right-0 w-[600px] h-[500px]" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline Column */}
            <div className="lg:col-span-8">
              {/* Live Draw Ticker */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-container border border-white/10 text-xs font-semibold mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                <span className="text-[#CCFF00] font-mono tracking-wide uppercase">
                  {activeDrawMonth ? `${activeDrawMonth} Community Draw` : 'Monthly Charity Draw'}
                </span>
                {latestRollover > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-amber-300 font-bold">
                      {formatCurrency(latestRollover)} Rollover
                    </span>
                  </>
                )}
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-white leading-[1.04] mb-8">
                Your game can <br />
                <span className="text-gradient-lime">do more.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-lg sm:text-xl md:text-2xl text-on-surface-variant font-sans leading-relaxed max-w-2xl mb-10">
                Track your Stableford performance, take part in monthly draws, and turn your subscription into meaningful charitable impact.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 max-w-md sm:max-w-none">
                <Link to="/signup">
                  <Button variant="lime" size="lg" className="w-full sm:w-auto" icon={<ArrowRight className="w-5 h-5 text-[#08090D]" />}>
                    Join Golf For Good
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    See how it works
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Editorial Callout Card */}
            <div className="lg:col-span-4">
              <div className="surface-editorial p-8 relative overflow-hidden border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#CCFF00]">
                    The Model
                  </span>
                  <span className="text-xs font-bold text-white/60">
                    Transparent
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm">
                      P
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">Play & Log</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Submit 18-hole Stableford scores from any regulation golf round.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm">
                      W
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">Win Cash Prizes</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Match 3, 4, or 5 numbers in the monthly community draw.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 font-display font-bold text-sm">
                      G
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">Give Back</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        Direct allocation to verified charitable partners of your choice.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Guaranteed minimum</span>
                  <span className="font-bold text-white">10% to Charity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. PLAY / WIN / GIVE BACK (The 3 Pillars) */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative bg-[#090C12] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16">
            <Badge variant="cream" size="md" className="mb-4">
              Core Pillars
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
              A smarter way to play and give.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
              Every round you log on the course connects your regular performance to real prizes and measurable community impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* PLAY Card */}
            <div className="surface-card p-8 sm:p-10 flex flex-col justify-between border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-8 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
                  01 &bull; PLAY
                </span>
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  Keep your game moving.
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                  Track your latest Stableford rounds and see your progress without losing sight of what matters. Enter points from 1–45 with no complicated handicap hurdles.
                </p>
              </div>
              <div className="pt-6 mt-8 border-t border-white/[0.06] flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span>5 active qualifying rounds retained</span>
              </div>
            </div>

            {/* WIN Card */}
            <div className="surface-card p-8 sm:p-10 flex flex-col justify-between border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-8 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Trophy className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-2">
                  02 &bull; WIN
                </span>
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  Your score could take you further.
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                  Your Stableford scores become part of the monthly draw, with opportunities to match 3, 4, or 5 numbers against independently drawn winning numbers.
                </p>
              </div>
              <div className="pt-6 mt-8 border-t border-white/[0.06] flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span>3 winning tiers &bull; 5-match jackpot rollover</span>
              </div>
            </div>

            {/* GIVE BACK Card */}
            <div className="surface-card p-8 sm:p-10 flex flex-col justify-between border-rose-500/20 hover:border-rose-500/40 transition-all duration-300 group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-8 border border-rose-500/20 group-hover:scale-105 transition-transform">
                  <Heart className="w-6 h-6 fill-rose-400" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-rose-400 font-bold block mb-2">
                  03 &bull; GIVE BACK
                </span>
                <h3 className="text-2xl font-display font-bold text-white mb-3">
                  Every round can create impact.
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                  Choose a charity you care about and decide how much of your subscription contribution goes toward their work. Start at 10% or increase up to 100%.
                </p>
              </div>
              <div className="pt-6 mt-8 border-t border-white/[0.06] flex items-center gap-2 text-xs font-semibold text-rose-400">
                <span>Direct partner allocation guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INTERACTIVE SCORE STORY (Educational Demo) */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <Badge variant="lime" size="md" className="mb-4">
              See How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
              Try the score-to-draw journey.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant">
              Interact with the demo below to see how five rounds become qualifying numbers and how your subscription funds both cash prizes and charity.
            </p>
          </div>

          <InteractiveScoreStory />
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. THE MONTHLY DRAW & TIERS */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 bg-[#090C12] border-t border-white/[0.06] relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <Badge variant="gold" size="md" className="mb-4">
                Transparent Prize Allocation
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
                Three ways to win each month.
              </h2>
              <p className="text-base sm:text-lg text-on-surface-variant">
                50% of community subscription fees directly fund the monthly prize pool. Match your active scores to win your equal share of the tier pool.
              </p>
            </div>
            <Link to="/how-it-works">
              <Button variant="outline" size="sm" icon={<HelpCircle className="w-4 h-4" />}>
                Detailed Draw Rules
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5-Match Tier */}
            <div className="surface-editorial p-8 border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="tier5" size="md">5 of 5 Match</Badge>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase">Jackpot</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-5xl font-black text-white">40%</span>
                  <span className="text-xs text-on-surface-variant ml-2 uppercase tracking-wider font-mono">of Prize Pool</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-sans">
                  Match all 5 of your qualifying Stableford scores against the 5 winning numbers drawn. If unclaimed, the entire 40% rolls over to next month's jackpot.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Jackpot carries forward if unclaimed</span>
              </div>
            </div>

            {/* 4-Match Tier */}
            <div className="surface-card p-8 border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="tier4" size="md">4 of 5 Match</Badge>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Tier 2</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-5xl font-black text-white">35%</span>
                  <span className="text-xs text-on-surface-variant ml-2 uppercase tracking-wider font-mono">of Prize Pool</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-sans">
                  Match 4 of your qualifying scores. Split equally among all qualifying players who achieve 4 matches in the monthly draw cycle.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-on-surface-variant font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Equal split among tier winners</span>
              </div>
            </div>

            {/* 3-Match Tier */}
            <div className="surface-card p-8 border-teal-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="tier3" size="md">3 of 5 Match</Badge>
                  <span className="text-xs font-mono font-bold text-teal-400 uppercase">Tier 3</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-5xl font-black text-white">25%</span>
                  <span className="text-xs text-on-surface-variant ml-2 uppercase tracking-wider font-mono">of Prize Pool</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-sans">
                  Match 3 of your qualifying scores. The most accessible tier, rewarding consistent solid play across your regular golf rounds.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-on-surface-variant font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>Equal split among tier winners</span>
              </div>
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <Badge variant="coral" size="md" className="mb-4">
                Partner Organizations
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-2">
                Featured Charities
              </h2>
              <p className="text-base text-on-surface-variant">
                Select from verified partner organizations doing vital work across communities.
              </p>
            </div>
            <Link to="/charities">
              <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                View All Charities
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCharities.map((charity) => (
              <div
                key={charity.id}
                className="surface-card overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-white/20"
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FINAL CTA SECTION */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden border-t border-white/[0.08] bg-[#07090E]">
        <AbstractGraphic variant="hero-mesh" glowColor="lime" className="opacity-30" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="lime" size="md" className="mb-6">
            Join the Community
          </Badge>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-white mb-6 leading-tight">
            Play for something bigger.
          </h2>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            Your game. Your chance. Your impact.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="lime" size="lg" icon={<ArrowRight className="w-5 h-5 text-[#08090D]" />}>
                Join Golf For Good
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg">
                Explore Mechanics
              </Button>
            </Link>
          </div>

          <p className="text-xs text-on-surface-variant/70 mt-8">
            Monthly and annual plans available &bull; Transparent draw rules &bull; Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
