import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import { AbstractGraphic } from '../components/ui/AbstractGraphic';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden text-center">
      <AbstractGraphic variant="hero-mesh" className="opacity-30" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-xl space-y-6"
      >
        <div className="w-20 h-20 bg-surface-container border border-white/10 rounded-3xl mx-auto flex items-center justify-center text-primary shadow-xl">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
        </div>

        <div>
          <span className="text-xs uppercase font-semibold text-primary tracking-widest block mb-2">
            Page Not Found • 404
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-bold text-foreground tracking-tight">
            Off the Fairway
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has moved. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link 
            to="/" 
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/10 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-surface-container border border-white/10 text-foreground font-semibold text-xs hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
