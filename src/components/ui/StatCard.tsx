import React from 'react';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: string;
  accentColor?: 'emerald' | 'gold' | 'coral' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accentColor = 'emerald',
  className = ''
}) => {
  const accentStyles = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    gold: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    coral: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    neutral: "text-slate-300 bg-slate-800/50 border-slate-700/50"
  };

  return (
    <div className={cn("surface-card p-6 relative overflow-hidden transition-all duration-200 hover:border-white/15", className)}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </span>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border flex-shrink-0", accentStyles[accentColor])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-3">
        <p className="font-display text-3xl font-bold tracking-tight text-on-surface">
          {value}
        </p>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      {subtext && (
        <p className="text-xs text-on-surface-variant mt-1.5 font-sans">
          {subtext}
        </p>
      )}
    </div>
  );
};
