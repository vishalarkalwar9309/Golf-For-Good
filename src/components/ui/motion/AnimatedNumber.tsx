import React, { useEffect, useState } from 'react';
import { useMotionValue, useSpring, useReducedMotion } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
}

/**
 * Reusable Animated Number component inspired by Motion Primitives.
 * Smoothly interpolates numerical transitions using spring physics.
 * Automatically respects prefers-reduced-motion.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format = (n) => Math.round(n).toString(),
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();
  const motionVal = useMotionValue(value);
  const springVal = useSpring(motionVal, {
    stiffness: 280,
    damping: 30,
    mass: 0.8
  });

  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }
    motionVal.set(value);
  }, [value, motionVal, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const unsubscribe = springVal.on('change', (latest) => {
      setDisplayValue(latest);
    });

    return () => unsubscribe();
  }, [springVal, shouldReduceMotion, value]);

  return (
    <span className={className}>
      {format(displayValue)}
    </span>
  );
};

export default AnimatedNumber;
