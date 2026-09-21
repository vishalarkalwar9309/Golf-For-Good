import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card p-20 flex flex-col items-center justify-center text-center space-y-8 border-dashed border-2 border-white/5",
        className
      )}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
        <div className="w-24 h-24 bg-surface-container-highest rounded-3xl border border-white/5 flex items-center justify-center relative z-10">
          <Icon className="w-10 h-10 text-on-surface-variant opacity-40" />
        </div>
      </div>
      
      <div className="max-w-sm space-y-3">
        <h3 className="text-2xl font-display font-bold uppercase tracking-tight">{title}</h3>
        <p className="text-on-surface-variant font-sans text-sm leading-relaxed">{description}</p>
      </div>

      {action && (
        <button 
          onClick={action.onClick}
          className="px-8 py-4 bg-white text-background rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
