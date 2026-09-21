import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UserSidebar from '../../components/layout/UserSidebar';
import { cn } from '../../lib/utils';

const DashboardLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background relative overflow-x-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-24 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between bg-surface-container/90 backdrop-blur-xl border border-white/10 mx-4 sm:mx-6 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/20 text-primary rounded-lg flex items-center justify-center">
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Member Dashboard</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
        </button>
      </header>

      {/* Sidebar - Desktop is fixed, Mobile is a drawer */}
      <div className={cn(
          "fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-500 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <UserSidebar onNavClick={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <main className="flex-grow min-h-screen pt-40 lg:pt-0 overflow-y-auto no-scrollbar relative z-10 w-full lg:max-w-[calc(100vw-320px)] ml-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
