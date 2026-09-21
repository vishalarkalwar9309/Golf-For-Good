import React from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Trophy, 
  Heart, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const HowItWorks: React.FC = () => {
  usePageTitle('How It Works');

  return (
    <div className="min-h-screen bg-background text-on-surface pt-28 pb-20">
      {/* Header */}
      <section className="relative px-6 md:px-12 py-16 md:py-24 text-center overflow-hidden">
        <AbstractGraphic variant="hero-mesh" glowColor="emerald" className="opacity-50" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Badge variant="emerald" size="md" className="mb-6">
            Transparent Platform Mechanics
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-white mb-6 leading-tight">
            How your round of golf <br />
            <span className="text-gradient-emerald">creates real change.</span>
          </h1>
          <p className="text-lg sm:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Golf For Good blends Stableford performance tracking with monthly cash draws and guaranteed charitable funding. Here is exactly how the platform works.
          </p>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '01',
              title: 'Play Your Round',
              desc: 'Tee off at any regulation golf course. There are no restrictions on course selection or time of play.',
              detail: 'Normal club or casual round'
            },
            {
              num: '02',
              title: 'Log Stableford Score',
              desc: 'Enter your 18-hole Stableford score (1–45) and the round date. The platform maintains your 5 most recent scores.',
              detail: '1 score per date; latest 5 kept'
            },
            {
              num: '03',
              title: 'Participate in the Draw',
              desc: 'Every month, 5 winning numbers are drawn. Match 3, 4, or 5 numbers to win a cash prize from the community pool.',
              detail: '3 tiers: 5-match, 4-match, 3-match'
            },
            {
              num: '04',
              title: 'Empower Your Charity',
              desc: 'A minimum 10% of your membership fee goes directly to your selected partner charity. Voluntary increase up to 100%.',
              detail: 'Direct philanthropic allocation'
            }
          ].map((s, i) => (
            <div key={i} className="surface-card p-8 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
              <div>
                <span className="font-display font-black text-3xl text-emerald-400/40 group-hover:text-emerald-400 transition-colors">
                  {s.num}
                </span>
                <h3 className="text-xl font-display font-bold text-white mt-4 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6 font-sans">
                  {s.desc}
                </p>
              </div>
              <div className="pt-4 border-t border-white/[0.06] text-xs font-semibold text-emerald-400">
                {s.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stableford Scoring Deep Dive */}
      <section id="scoring" className="px-6 md:px-12 max-w-7xl mx-auto mb-24">
        <div className="surface-elevated p-8 md:p-14 relative overflow-hidden">
          <div className="max-w-3xl">
            <Badge variant="neutral" size="md" className="mb-4">
              Scoring Standard
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
              The 1–45 Stableford Range
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed mb-8">
              Stableford scoring awards points per hole based on net score relative to par (e.g., 2 points for a net par, 3 for a net birdie). In regulation 18-hole play, scores consistently fall between 1 and 45 points.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <h4 className="text-sm font-bold text-white mb-1">One Score Per Date</h4>
                <p className="text-xs text-on-surface-variant">Duplicate rounds on the same date are rejected. Players can edit or delete existing scores at any time.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <h4 className="text-sm font-bold text-white mb-1">Rolling 5-Score Retention</h4>
                <p className="text-xs text-on-surface-variant">Only your 5 most recent scores are held in your active draw entry. When a 6th score is entered, the oldest score is superseded automatically.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Official club or golf application scorecard screenshots are used to verify winning claims.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Draw Tiers & Rollover */}
      <section id="draw-tiers" className="px-6 md:px-12 max-w-7xl mx-auto mb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="gold" size="md" className="mb-4">
            Prize Allocation Model
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Predetermined, Fair & Audited
          </h2>
          <p className="text-base text-on-surface-variant">
            A fixed 50% of every active subscription fee directly enters the monthly cash prize pool. Winnings are distributed strictly according to PRD specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="surface-card p-8 border-amber-500/30 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Tier 1 &bull; Jackpot</span>
              <h3 className="text-3xl font-display font-black text-white mt-2 mb-1">5-Match</h3>
              <p className="text-2xl font-bold text-amber-300 mb-4">40% of Pool</p>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                All 5 of your latest scores match the drawn numbers. If nobody hits all 5, the entire 40% rolls over to augment the next month's jackpot.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Includes carry-forward rollover</span>
            </div>
          </div>

          <div className="surface-card p-8 border-emerald-500/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Tier 2</span>
              <h3 className="text-3xl font-display font-black text-white mt-2 mb-1">4-Match</h3>
              <p className="text-2xl font-bold text-emerald-300 mb-4">35% of Pool</p>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                4 of your 5 latest scores match the drawn numbers. Split equally among all 4-match winners for the month. Does not roll over.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-on-surface-variant font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Equal split across winners</span>
            </div>
          </div>

          <div className="surface-card p-8 border-teal-500/20 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Tier 3</span>
              <h3 className="text-3xl font-display font-black text-white mt-2 mb-1">3-Match</h3>
              <p className="text-2xl font-bold text-teal-300 mb-4">25% of Pool</p>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                3 of your 5 latest scores match the drawn numbers. High probability tier rewarding consistent regular golfers. Does not roll over.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-on-surface-variant font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              <span>Equal split across winners</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 md:px-12 max-w-4xl mx-auto text-center">
        <div className="surface-card p-12 relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
            Ready to make your rounds count?
          </h2>
          <p className="text-base text-on-surface-variant max-w-xl mx-auto mb-8">
            Select your preferred plan, choose your charity partner, and submit your latest scores to participate in the upcoming draw.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                Join the Draw Now
              </Button>
            </Link>
            <Link to="/charities">
              <Button variant="outline" size="lg">
                View Partner Charities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;
