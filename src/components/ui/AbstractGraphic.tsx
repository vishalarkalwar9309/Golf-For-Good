import React from 'react';

interface AbstractGraphicProps {
  variant?: 'hero-mesh' | 'wave-divider' | 'contour-blob' | 'impact-glow' | 'draw-orbit' | 'organic-topography' | 'ambient-glow';
  className?: string;
  glowColor?: 'emerald' | 'gold' | 'coral' | 'lime' | 'cream' | 'neutral';
}

/**
 * Editorial Abstract Organic Visual Primitives for Golf For Good.
 * Provides custom SVG layered contour waves, ambient glow fields, and geometric accents
 * strictly avoiding traditional golf clichés ("Feel, not fairway").
 */
export const AbstractGraphic: React.FC<AbstractGraphicProps> = ({
  variant = 'hero-mesh',
  className = '',
  glowColor = 'emerald'
}) => {
  const colorGradients = {
    emerald: {
      primary: '#10B981',
      secondary: '#059669',
      glow: 'rgba(16, 185, 129, 0.14)'
    },
    lime: {
      primary: '#CCFF00',
      secondary: '#6EE7B7',
      glow: 'rgba(204, 255, 0, 0.12)'
    },
    cream: {
      primary: '#FBF9F5',
      secondary: '#E2DDD5',
      glow: 'rgba(251, 249, 245, 0.08)'
    },
    gold: {
      primary: '#F59E0B',
      secondary: '#D97706',
      glow: 'rgba(245, 158, 11, 0.14)'
    },
    coral: {
      primary: '#F43F5E',
      secondary: '#BE123C',
      glow: 'rgba(244, 63, 94, 0.14)'
    },
    neutral: {
      primary: '#334155',
      secondary: '#1E293B',
      glow: 'rgba(255, 255, 255, 0.05)'
    }
  };

  const selected = colorGradients[glowColor];

  if (variant === 'hero-mesh') {
    return (
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
        {/* Ambient Radial Glows */}
        <div 
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[140px] opacity-60"
          style={{ background: `radial-gradient(circle, ${selected.glow} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute top-[30%] -left-[10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-40"
          style={{ background: `radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)` }}
        />

        {/* Layered Organic Contours */}
        <svg
          className="absolute w-full h-full opacity-20"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M-100 450 C300 250, 600 650, 1100 350 C1300 220, 1500 480, 1600 500"
            stroke="url(#hero-stroke-1)"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />
          <path
            d="M-100 520 C350 320, 650 720, 1150 420 C1350 290, 1550 550, 1600 570"
            stroke="url(#hero-stroke-2)"
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M-50 200 C400 400, 800 100, 1200 400 C1400 550, 1550 300, 1600 350"
            stroke="url(#hero-stroke-1)"
            strokeWidth="1"
            opacity="0.4"
          />
          <defs>
            <linearGradient id="hero-stroke-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={selected.primary} stopOpacity="0" />
              <stop offset="50%" stopColor={selected.primary} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hero-stroke-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
              <stop offset="50%" stopColor={selected.primary} stopOpacity="0.5" />
              <stop offset="100%" stopColor={selected.secondary} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'contour-blob') {
    return (
      <div className={`pointer-events-none relative overflow-hidden ${className}`}>
        <svg
          viewBox="0 0 600 600"
          className="w-full h-full opacity-25"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M441.5,335.5Q413,421,327,452Q241,483,161,424.5Q81,366,80.5,274Q80,182,154.5,123.5Q229,65,321,88.5Q413,112,441.5,181Q470,250,441.5,335.5Z"
            fill="url(#blob-grad)"
          />
          <defs>
            <linearGradient id="blob-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={selected.primary} stopOpacity="0.4" />
              <stop offset="100%" stopColor={selected.secondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'draw-orbit') {
    return (
      <div className={`pointer-events-none relative ${className}`}>
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <circle cx="200" cy="200" r="180" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          <circle cx="200" cy="200" r="130" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="200" cy="200" r="80" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1.5" />
          <circle cx="200" cy="20" r="4" fill="#F59E0B" className="animate-pulse" />
          <circle cx="70" cy="200" r="3" fill="#10B981" />
        </svg>
      </div>
    );
  }

  if (variant === 'organic-topography') {
    return (
      <div className={`pointer-events-none relative overflow-hidden ${className}`}>
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full opacity-15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50 300 C 180 150, 320 450, 500 280 C 650 140, 720 400, 850 320"
            stroke={selected.primary}
            strokeWidth="1.5"
          />
          <path
            d="M 20 380 C 160 220, 350 500, 530 350 C 680 220, 750 480, 880 400"
            stroke={selected.secondary}
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <path
            d="M 80 220 C 220 80, 290 380, 470 200 C 620 60, 700 320, 820 240"
            stroke={selected.primary}
            strokeWidth="1"
            opacity="0.6"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`pointer-events-none ${className}`}>
      <div 
        className="w-full h-full rounded-full blur-[100px] opacity-30"
        style={{ background: selected.glow }}
      />
    </div>
  );
};
