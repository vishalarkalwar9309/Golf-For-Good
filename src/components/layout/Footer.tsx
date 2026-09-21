import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#07080B] border-t border-white/[0.07] pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group inline-flex">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Heart className="w-4 h-4 text-slate-950 fill-slate-950" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-white">
                Golf <span className="text-primary">For Good</span>
              </span>
            </Link>
            <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed mb-6">
              A golf performance platform built on purpose. Play your normal game, track your Stableford scores, participate in monthly draws, and directly fund verified charities with every subscription.
            </p>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Transparent charitable allocation &bull; Verified partner charities</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-2 font-display">
              Platform
            </h4>
            <Link to="/how-it-works" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              How It Works
            </Link>
            <Link to="/charities" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              Charity Directory
            </Link>
            <Link to="/leaderboard" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link to="/dashboard" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              Player Dashboard
            </Link>
          </div>

          {/* Draw & Rules Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-2 font-display">
              Draw & Impact
            </h4>
            <Link to="/how-it-works#draw-tiers" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              5-Match & Rollover
            </Link>
            <Link to="/how-it-works#scoring" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              Stableford System
            </Link>
            <Link to="/charities" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              Impact Partners
            </Link>
            <Link to="/signup" className="text-sm text-on-surface-variant hover:text-white transition-colors">
              Membership Plans
            </Link>
          </div>

          {/* Trust & Transparency */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-2 font-display">
              Governance
            </h4>
            <span className="text-sm text-on-surface-variant">
              Minimum 10% of each subscriber fee is designated directly to player-chosen charities.
            </span>
            <span className="text-xs text-on-surface-variant/70 mt-2">
              Monthly draw results are mathematically audited and verified via official club scorecards.
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <p>&copy; {new Date().getFullYear()} Golf For Good. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Play. Win. Give back.</span>
            <span>United Kingdom</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
