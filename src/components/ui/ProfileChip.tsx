import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import RoleBadge from './RoleBadge';
import { cn } from '../../lib/utils';
import { User as UserIcon } from 'lucide-react';

interface ProfileChipProps {
  className?: string;
  showDetails?: boolean;
}

const ProfileChip: React.FC<ProfileChipProps> = ({ className, showDetails = true }) => {
  const { profile } = useAuth();

  if (!profile) return null;

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className={cn("flex items-center gap-4 group", className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors">{initials}</span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
      </div>
      
      {showDetails && (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            {profile.role === 'admin' ? (
              <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-secondary/20 text-secondary border border-secondary/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                System Admin
              </span>
            ) : profile.subscription_status === 'active' ? (
              <span className={cn(
                "text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border",
                profile.subscription_tier === 'yearly' 
                  ? "bg-secondary/20 text-secondary border-secondary/30 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                  : "bg-primary/20 text-primary border-primary/30 shadow-[0_0_15px_rgba(78,222,163,0.1)]"
              )}>
                {profile.subscription_tier === 'yearly' 
                  ? 'Sovereign Member' 
                  : profile.subscription_tier === 'monthly' 
                    ? 'Elite Member' 
                    : 'Spectator Member'}
              </span>
            ) : profile.subscription_status === 'cancelled' ? (
              <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/30">
                Cancelled
              </span>
            ) : profile.subscription_status === 'lapsed' ? (
              <span className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Lapsed
              </span>
            ) : (
              <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/50 px-2 py-0.5 border border-white/5 rounded-md">
                Basic Member
              </span>
            )}
          </div>
          <p className="text-xs font-display font-bold uppercase tracking-tight text-on-surface">
            {profile.full_name}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileChip;
