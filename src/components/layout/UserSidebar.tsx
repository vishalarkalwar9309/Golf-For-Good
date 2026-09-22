import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  Trophy, 
  Award, 
  Heart, 
  CreditCard,
  LogOut,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/AuthProvider';
import { clearUserCache } from '../../services/dataService';
import { cn } from '../../lib/utils';
import ProfileChip from '../ui/ProfileChip';
import { Badge } from '../ui/Badge';

interface UserSidebarProps {
  onNavClick?: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ onNavClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      clearUserCache();
    } catch (err) {
      console.error('Error clearing cache:', err);
    }

    try {
      await Promise.race([
        signOut(),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } catch (err) {
      console.warn('Sign out completed with fallback:', err);
    }

    try {
      navigate('/login', { replace: true });
    } catch {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Target, label: 'Scores', path: '/dashboard/scores' },
    { icon: Trophy, label: 'Monthly Draw', path: '/dashboard/draws' },
    { icon: Award, label: 'Winnings & Proof', path: '/dashboard/winnings' },
    { icon: Heart, label: 'Charity Impact', path: '/dashboard/charity' },
    { icon: CreditCard, label: 'Membership', path: '/dashboard/subscription' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const planLabel = profile?.subscription_status === 'active'
    ? `${profile.subscription_tier === 'yearly' ? 'Yearly' : 'Monthly'} Member`
    : profile?.subscription_status === 'cancelled'
      ? 'Cancelled'
      : profile?.subscription_status === 'lapsed'
        ? 'Lapsed'
        : 'Free Account';

  return (
    <aside className="w-72 h-screen sticky top-0 bg-[#0A0C12] border-r border-white/[0.08] flex flex-col z-40">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-3 group" onClick={onNavClick}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-display font-bold tracking-tight text-white leading-none">
              Golf <span className="text-primary">For Good</span>
            </span>
            <div className="mt-1.5">
              <Badge 
                variant={profile?.subscription_status === 'active' ? 'emerald' : 'neutral'} 
                size="sm" 
                dot
              >
                {planLabel}
              </Badge>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
          Player Navigation
        </p>

        {menuItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={cn(
                "flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-medium group",
                active 
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "text-on-surface-variant hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  active ? "text-primary" : "text-on-surface-variant group-hover:text-white"
                )} />
                <span>{item.label}</span>
              </div>
              {active && (
                <motion.div 
                  layoutId="user-sidebar-active"
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account Section */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ProfileChip showDetails={true} />
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Sign Out"
          aria-label="Sign Out"
          className={cn(
            "relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer flex-shrink-0 text-on-surface-variant hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 border border-transparent hover:border-rose-500/20",
            isSigningOut && "opacity-80 cursor-wait pointer-events-none"
          )}
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              <span className="text-[11px] font-medium text-rose-300">Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              <span className="text-[11px] font-medium">Sign Out</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;
