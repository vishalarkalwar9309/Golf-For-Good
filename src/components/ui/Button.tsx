import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'lime' | 'cream';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();
  const baseStyles = "inline-flex items-center justify-center font-display font-semibold transition-colors duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5"
  };

  const variantStyles = {
    primary: "bg-primary text-[#08090D] hover:bg-primary-light shadow-md shadow-primary/20 hover:shadow-primary/30",
    secondary: "bg-secondary text-[#08090D] hover:bg-secondary-light shadow-md shadow-secondary/20 hover:shadow-secondary/30",
    lime: "bg-[#CCFF00] text-[#08090D] hover:bg-[#E0FF66] shadow-md shadow-[#CCFF00]/20 hover:shadow-[#CCFF00]/30 font-bold",
    cream: "bg-[#FBF9F5] text-[#08090D] hover:bg-white shadow-sm text-slate-950 font-semibold",
    outline: "border border-white/15 bg-white/[0.03] text-on-surface hover:bg-white/[0.08] hover:border-white/25",
    ghost: "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05]"
  };

  return (
    <motion.button
      whileHover={!disabled && !loading && !shouldReduceMotion ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading && !shouldReduceMotion ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

