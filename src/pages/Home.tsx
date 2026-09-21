import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { usePageTitle } from '../hooks/usePageTitle';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Charity } from '../types';
import { getLatestRollover } from '../lib/draw';

const Home: React.FC = () => {
  usePageTitle('Your game can do more');
  const [featuredCharities, setFeaturedCharities] = useState<Charity[]>([]);
  const [latestRollover, setLatestRollover] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [rolloverAmount, { data: charitiesData }] = await Promise.all([
          getLatestRollover(),
          supabase.from('charities').select('*').eq('featured', true).limit(3)
        ]);

        setLatestRollover(rolloverAmount || 0);
        setFeaturedCharities(charitiesData || []);
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
      {/* 1. HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 px-6 md:px-12 overflow-hidden flex items-center justify-center">
        {/* Haikei-Style Abstract Organic Visuals */}
        <AbstractGraphic variant="hero-mesh" glowColor="emerald" />

        <div className="max-w-5xl mx-auto w-full text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Live Draw Ticker Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Monthly Charity Draw Active</span>
              {latestRollover > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-emerald-400/40" />
                  <span className="text-amber-300 font-bold">
                    {formatCurrency(latestRollover)} 5-Match Rollover
                  </span>
                </>
              )}
            </div>

            {/* Headline Concept */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-white leading-[1.05] max-w-4xl text-balance mb-6">
              Your game can <br />
              <span className="text-gradient-emerald">do more.</span>
            </h1>

            {/* Concise Supporting Message */}
            <p className="text-lg sm:text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto font-sans leading-relaxed text-balance mb-10">
              Track your Stableford scores, participate in monthly cash prize draws, and directly fund verified charities with every subscription.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto" icon={<ArrowRight className="w-5 h-5" />}>
                  Join the Draw
                </Button>
              </Link>
              <Link to="/how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  How It Works
                </Button>
              </Link>
            </div>

            {/* Social Trust Metrics */}
            <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 pt-12 border-t border-white/[0.08] w-full max-w-2xl text-center">
              <div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-white">100%</p>
                <p className="text-xs text-on-surface-variant mt-1">Verified Club Scores</p>
              </div>
              <div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-emerald-400">Min 10%</p>
                <p className="text-xs text-on-surface-variant mt-1">Direct to Your Charity</p>
              </div>
              <div>
                <p className="font-display font-bold text-2xl sm:text-3xl text-amber-400">3 Tiers</p>
                <p className="text-xs text-on-surface-variant mt-1">Monthly Cash Winners</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. HOW IT WORKS SECTION */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative bg-[#0B0D13]/60 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="emerald" size="md" className="mb-4">
              Simple 4-Step Cycle
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
              Play. Track. Win. Give back.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant">
              No complicated handicap math. Play your normal round, log your Stableford points, and let your consistency do the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: '01',
                title: 'PLAY',
                headline: 'Play your normal game',
                desc: 'Tee off at any regulation golf course. Play your preferred game and record your individual hole scores.',
                icon: Target,
                color: 'text-emerald-400',
                border: 'hover:border-emerald-500/40'
              },
              {
                step: '02',
                title: 'TRACK',
                headline: 'Enter Stableford score',
                desc: 'Submit your 18-hole Stableford total (range 1–45) with the round date. The platform maintains your 5 latest scores.',
                icon: Sparkles,
                color: 'text-teal-400',
                border: 'hover:border-teal-500/40'
              },
              {
                step: '03',
                title: 'DRAW',
                headline: 'Participate in the draw',
                desc: 'Every month, 5 winning numbers are drawn. Match 3, 4, or 5 of your latest scores to win your share of the prize pool.',
                icon: Trophy,
                color: 'text-amber-400',
                border: 'hover:border-amber-500/40'
              },
              {
                step: '04',
                title: 'GIVE BACK',
                headline: 'Fund your charity',
                desc: 'A guaranteed portion of your subscription goes straight to your chosen cause. Voluntary increases up to 100%.',
                icon: Heart,
                color: 'text-rose-400',
                border: 'hover:border-rose-500/40'
              }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className={cn(
                    "surface-card p-8 flex flex-col justify-between relative transition-all duration-300 group",
                    card.border
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="font-display font-extrabold text-2xl text-white/30 group-hover:text-white/60 transition-colors">
                        {card.step}
                      </span>
                      <div className={cn("w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center", card.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 font-display">
                      {card.title}
                    </p>
                    <h3 className="text-xl font-display font-bold text-white mb-3">
                      {card.headline}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. THE DRAW & PRIZE ALLOCATION */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-16">
            <div>
              <Badge variant="gold" size="md" className="mb-4">
                Monthly Prize Pool Structure
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4">
                Three ways to win every month.
              </h2>
              <p className="text-base sm:text-lg text-on-surface-variant max-w-xl">
                Prize pools are automatically funded by active members. Match your scores against the monthly draw to take home your tier split.
              </p>
            </div>
            <Link to="/how-it-works">
              <Button variant="outline" size="sm" icon={<HelpCircle className="w-4 h-4" />}>
                Draw Rules & Details
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5 Match */}
            <div className="surface-card p-8 border-amber-500/30 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="tier5" size="md">5 of 5 Match</Badge>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Jackpot</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-5xl font-black text-white">40%</span>
                  <span className="text-sm text-on-surface-variant ml-2 font-medium">of Total Prize Pool</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Match all 5 of your latest Stableford scores against the winning numbers. If unclaimed, the entire 40% rolls over to the next month's jackpot.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Jackpot carries forward if unclaimed</span>
              </div>
            </div>

            {/* 4 Match */}
            <div className="surface-card p-8 border-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="tier4" size="md">4 of 5 Match</Badge>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Tier 2</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-5xl font-black text-white">35%</span>
                  <span className="text-sm text-on-surface-variant ml-2 font-medium">of Total Prize Pool</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Match 4 of your latest scores. Split equally between all players who hit 4 numbers in the monthly cycle.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-on-surface-variant font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Equal split among tier winners</span>
              </div>
            </div>

            {/* 3 Match */}
            <div className="surface-card p-8 border-teal-500/20 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <Badge variant="tier3" size="md">3 of 5 Match</Badge>
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Tier 3</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-5xl font-black text-white">25%</span>
                  <span className="text-sm text-on-surface-variant ml-2 font-medium">of Total Prize Pool</span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Match 3 of your latest scores. The most accessible tier, rewarding consistent solid play across your regular golf rounds.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-on-surface-variant font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span>Equal split among tier winners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. IMPACT SECTION */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-[#0B0D13] to-background border-t border-white/[0.06] relative overflow-hidden">
        <AbstractGraphic variant="contour-blob" glowColor="coral" className="absolute -right-24 -bottom-24 w-96 h-96" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="coral" size="md" className="mb-6">
                Purpose Driven
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-6 leading-tight">
                Every round can give <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                  something back.
                </span>
              </h2>
              <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed mb-8">
                Unlike traditional lotteries or sweepstakes where entry fees disappear into administration, Golf For Good puts charity at the heart of the membership model.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: 'Direct Allocation',
                    desc: 'A minimum of 10% of your membership fee is automatically earmarked for your selected charity.'
                  },
                  {
                    title: 'Player Choice',
                    desc: 'You select the cause that matters to you from our directory of verified charitable partners.'
                  },
                  {
                    title: 'Voluntary Generosity',
                    desc: 'Players can choose to increase their personal contribution percentage up to 100% anytime.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Heart className="w-3.5 h-3.5 fill-rose-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact Visualizer Card */}
            <div className="surface-elevated p-8 md:p-12 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Charitable Model
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  Guaranteed
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-white">Player Selected Charity</span>
                    <span className="text-emerald-400">10% - 100%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-2/5" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    Subscribers choose the exact split for their designated charity partner.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-white">Monthly Draw Cash Prize Pool</span>
                    <span className="text-amber-400">50% of fees + Rollover</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full w-3/5" />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5">
                    Directly funds the 5-match, 4-match, and 3-match winner payouts.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Independent Donations</span>
                <Link to="/charities" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1">
                  Browse Directory <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. FEATURED CHARITIES */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <Badge variant="neutral" size="md" className="mb-4">
                Partner Spotlight
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
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
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
      {/* 6. FINAL SUBSCRIPTION CTA */}
      {/* ============================================================ */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden border-t border-white/[0.08] bg-[#0A0C13]">
        <AbstractGraphic variant="hero-mesh" glowColor="gold" className="opacity-40" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge variant="gold" size="md" className="mb-6">
            Get Started Today
          </Badge>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-white mb-6 leading-tight">
            Play for yourself. <br />
            <span className="text-gradient-gold">Give for something bigger.</span>
          </h2>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            Join subscribers turning everyday golf rounds into monthly prizes and verified charitable support.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="secondary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Join the Draw Now
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
