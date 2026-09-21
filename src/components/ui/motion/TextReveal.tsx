import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  highlightWords?: string[];
  highlightClass?: string;
}

/**
 * Editorial Word-Level Text Reveal component inspired by Motion Primitives.
 * Fast, natural entrance that reveals headline copy word by word.
 * Automatically respects prefers-reduced-motion.
 */
export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  className = '',
  delay = 0,
  highlightWords = [],
  highlightClass = 'text-gradient-lime'
}) => {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(' ');

  if (shouldReduceMotion) {
    return (
      <span className={className}>
        {words.map((word, i) => {
          const isHighlight = highlightWords.includes(word.replace(/[^a-zA-Z]/g, ''));
          return (
            <React.Fragment key={i}>
              <span className={isHighlight ? highlightClass : ''}>{word}</span>
              {i < words.length - 1 ? ' ' : ''}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.045,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 18,
      filter: 'blur(3px)'
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        const isHighlight = highlightWords.includes(cleanWord);
        return (
          <span key={i} className="inline-block overflow-hidden py-0.5 mr-[0.25em] last:mr-0">
            <motion.span
              variants={wordVariants}
              className={`inline-block ${isHighlight ? highlightClass : ''}`}
            >
              {word}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );
};

export default TextReveal;
