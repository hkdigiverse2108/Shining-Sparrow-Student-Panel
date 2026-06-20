import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1] as const, // Premium ease-out (cubic-bezier)
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.22,
      ease: [0.7, 0, 0.84, 0] as const, // Fast ease-in
    },
  },
};

export const pageChildVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
};
