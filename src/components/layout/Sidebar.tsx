import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Trophy, 
  Heart, 
  Dices, 
  Coins, 
  Settings, 
  HelpCircle,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../auth/AuthProvider';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
    { icon: Trophy, label: 'Scores', path: '/leaderboard' },
    { icon: Heart, label: 'Charity', path: '/charities' },
    { icon: Dices, label: 'Draws', path: '/draws' },
    { icon: Coins, label: 'Winnings', path: '/winnings' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-24 bg-[#0D0D0D] border-r border-white/5 flex flex-col items-center py-10 z-50">
      <Link to="/" className="mb-16 group">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
          <Trophy className="w-8 h-8 text-background" />
        </div>
      </Link>

      <nav className="flex-grow flex flex-col gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-500 group relative",
              isActive(item.path) 
                ? "bg-white/5 text-primary" 
                : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
            )}
          >
            <item.icon className={cn(
              "w-6 h-6 transition-transform duration-500 group-hover:scale-110",
              isActive(item.path) && "stroke-[2.5px]"
            )} />
            
            {/* Tooltip */}
            <div className="absolute left-24 px-4 py-2 bg-surface-container border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-2xl">
              {item.label}
            </div>

            {isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_15px_rgba(0,209,129,0.5)]" />
            )}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-6 mt-auto">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group relative",
              isActive(item.path) 
                ? "bg-white/5 text-primary" 
                : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
            )}
          >
            <item.icon className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            {/* Tooltip */}
            <div className="absolute left-24 px-4 py-2 bg-surface-container border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-2xl">
              {item.label}
            </div>
          </Link>
        ))}
        <button
          onClick={signOut}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-all group relative"
        >
          <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          {/* Tooltip */}
          <div className="absolute left-24 px-4 py-2 bg-surface-container border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-on-surface opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-2xl">
            Sign Out
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
