import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface FadeSlideProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
}

/**
 * Reusable Fade & Slide reveal primitive inspired by Motion Primitives.
 * Triggers entrance animation when scrolled into view.
 * Automatically respects prefers-reduced-motion.
 */
export const FadeSlide: React.FC<FadeSlideProps> = ({
  children,
  direction = 'up',
  distance = 20,
  delay = 0,
  duration = 0.45,
  className = '',
  triggerOnce = true
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 }
  }[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: offset.x,
        y: offset.y
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      viewport={{ once: triggerOnce, margin: '-60px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeSlide;
