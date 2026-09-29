import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingReaction } from './FloatingReaction';

const REACTIONS = [
  { emoji: '🔥', id: 'fire' },
  { emoji: '👏', id: 'clap' },
  { emoji: '⚡', id: 'zap' },
  { emoji: '❤️', id: 'heart' },
  { emoji: '😮', id: 'wow' },
  { emoji: '🏆', id: 'trophy' },
];

export const ReactionBar: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({
    fire: 124, clap: 89, zap: 45, heart: 210, wow: 12, trophy: 56
  });
  const [floating, setFloating] = useState<{id: number, emoji: string, x: number}[]>([]);

  const handleReact = (id: string, emoji: string, event: React.MouseEvent) => {
    setCounts(prev => ({ ...prev, [id]: prev[id] + 1 }));
    
    // Create floating element
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const newFloat = {
      id: Date.now(),
      emoji,
      x: rect.left + rect.width / 2 - 10,
    };
    
    setFloating(prev => [...prev, newFloat]);
    setTimeout(() => {
      setFloating(prev => prev.filter(f => f.id !== newFloat.id));
    }, 2000);
  };

  return (
    <div className="bg-[#080A0D] border border-white/5 p-4 rounded-full inline-flex items-center space-x-2 md:space-x-6 backdrop-blur-md">
      {REACTIONS.map(reaction => (
        <motion.button
          key={reaction.id}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => handleReact(reaction.id, reaction.emoji, e)}
          className="flex flex-col items-center group"
        >
          <span className="text-2xl md:text-3xl mb-1 filter grayscale group-hover:grayscale-0 transition-all">{reaction.emoji}</span>
          <span className="text-[10px] text-white/50 font-bold">{counts[reaction.id]}</span>
        </motion.button>
      ))}
      
      {/* Floating layer */}
      <AnimatePresence>
        {floating.map(f => (
          <FloatingReaction key={f.id} emoji={f.emoji} startX={f.x} />
        ))}
      </AnimatePresence>
    </div>
  );
};
