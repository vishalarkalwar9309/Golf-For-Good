import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'gold' | 'coral' | 'neutral' | 'tier5' | 'tier4' | 'tier3';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold",
    md: "px-3 py-1 text-xs tracking-wide font-medium"
  };

  const variantStyles = {
    emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    gold: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    coral: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    neutral: "bg-slate-800/60 text-slate-300 border border-slate-700/50",
    tier5: "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/10",
    tier4: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    tier3: "bg-teal-500/15 text-teal-300 border border-teal-500/30"
  };

  const dotColors = {
    emerald: "bg-emerald-400",
    gold: "bg-amber-400",
    coral: "bg-rose-400",
    neutral: "bg-slate-400",
    tier5: "bg-amber-300 animate-pulse",
    tier4: "bg-emerald-400",
    tier3: "bg-teal-400"
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full", sizeStyles[size], variantStyles[variant], className)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])} />}
      {children}
    </span>
  );
};
