import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Trophy, 
  Heart, 
  CreditCard, 
  Award, 
  BarChart3, 
  LayoutDashboard, 
  LogOut,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../auth/AuthProvider';
import { clearUserCache } from '../../services/dataService';
import { cn } from '../../lib/utils';
import ProfileChip from '../ui/ProfileChip';
import { Badge } from '../ui/Badge';

interface AdminSidebarProps {
  onNavClick?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onNavClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
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
      console.warn('Admin sign out completed with fallback:', err);
    }

    try {
      navigate('/login', { replace: true });
    } catch {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
    { icon: Users, label: 'Users & Scores', path: '/admin/users' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: Trophy, label: 'Draw Management', path: '/admin/draws' },
    { icon: Heart, label: 'Charity Directory', path: '/admin/charities' },
    { icon: Award, label: 'Winner Verification', path: '/admin/winners' },
    { icon: BarChart3, label: 'Reports & Analytics', path: '/admin/analytics' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-72 h-screen sticky top-0 bg-[#090A0E] border-r border-white/[0.08] flex flex-col z-40">
      {/* Admin Logo Header */}
      <div className="p-6 border-b border-white/[0.06]">
        <Link to="/admin" className="flex items-center gap-3 group" onClick={onNavClick}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-display font-bold tracking-tight text-white leading-none">
              Golf <span className="text-secondary">Admin</span>
            </span>
            <div className="mt-1.5">
              <Badge variant="gold" size="sm" dot>
                Administrator Console
              </Badge>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
          Management Controls
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
                  ? "bg-secondary/15 text-amber-300 font-semibold" 
                  : "text-on-surface-variant hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn(
                  "w-4 h-4 transition-colors",
                  active ? "text-secondary" : "text-on-surface-variant group-hover:text-white"
                )} />
                <span>{item.label}</span>
              </div>
              {active && (
                <motion.div 
                  layoutId="admin-sidebar-active"
                  className="w-1.5 h-1.5 rounded-full bg-secondary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-white/[0.06] mt-4">
          <Link
            to="/dashboard"
            onClick={onNavClick}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs text-on-surface-variant hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <Trophy className="w-4 h-4 text-primary" />
            <span>Switch to Player View</span>
          </Link>
        </div>
      </nav>

      {/* Admin Profile & Signout */}
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

export default AdminSidebar;
