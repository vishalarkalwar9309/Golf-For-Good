import React from 'react';
import { cn } from '../../lib/utils';
import { UserRole } from '../../types';

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  if (role !== 'admin') return null;
  
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border bg-secondary/10 border-secondary/30 text-secondary shadow-[0_0_15px_rgba(212,175,55,0.1)]",
      className
    )}>
      Admin
    </span>
  );
};

export default RoleBadge;
