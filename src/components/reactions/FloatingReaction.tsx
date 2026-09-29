import React from 'react';
import { motion } from 'framer-motion';

export const FloatingReaction: React.FC<{ emoji: string; startX: number }> = ({ emoji, startX }) => {
  const randomDrift = (Math.random() - 0.5) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
      animate={{ 
        opacity: 0, 
        y: -150, 
        x: randomDrift,
        scale: 1.5 
      }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed pointer-events-none text-4xl z-[100]"
      style={{ left: startX, bottom: 100 }}
    >
      {emoji}
    </motion.div>
  );
};
