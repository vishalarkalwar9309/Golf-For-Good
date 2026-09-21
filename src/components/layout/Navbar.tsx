import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../auth/AuthProvider';
import { cn } from '../../lib/utils';
import ProfileChip from '../ui/ProfileChip';
import { Button } from '../ui/Button';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (isDashboard) return null;

  const navLinks = [
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'Charities', path: '/charities' },
    { name: 'Leaderboard', path: '/leaderboard' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-12",
        scrolled
          ? "bg-[#08090D]/85 backdrop-blur-xl border-b border-white/[0.08] py-4"
          : "bg-transparent py-6"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-xl tracking-tight text-white leading-none">
              Golf <span className="text-primary">For Good</span>
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium tracking-wide">
              Play. Win. Give back.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-white relative py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
                isActive(link.path) ? "text-white font-semibold" : "text-on-surface-variant"
              )}
            >
              {link.name}
              {isActive(link.path) && (
                <motion.div
                  layoutId="navbar-active-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <ProfileChip showDetails={false} />
              <Link to={profile?.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button variant="outline" size="sm" icon={<LayoutDashboard className="w-4 h-4 text-primary" />}>
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 text-on-surface-variant hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-on-surface-variant hover:text-white px-3 py-2 transition-colors"
              >
                Log In
              </Link>
              <Link to="/signup">
                <Button variant="lime" size="sm" icon={<ArrowRight className="w-4 h-4 text-[#08090D]" />}>
                  Join Golf For Good
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          className="md:hidden w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sheet Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-[#0C0E14]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-8 shadow-2xl"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-lg font-display font-medium py-2 px-3 rounded-lg transition-colors",
                    isActive(link.path)
                      ? "text-primary bg-primary/10"
                      : "text-on-surface-variant hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-px bg-white/10 my-2" />

              {user ? (
                <div className="flex flex-col gap-3">
                  <Link to={profile?.role === 'admin' ? '/admin' : '/dashboard'}>
                    <Button variant="primary" size="md" className="w-full">
                      Open Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" size="md" onClick={signOut} className="w-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link to="/signup">
                    <Button variant="lime" size="md" className="w-full">
                      Join Golf For Good
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="md" className="w-full">
                      Log In
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
