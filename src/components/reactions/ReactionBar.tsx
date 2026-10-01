import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FloatingReaction } from './FloatingReaction';
import { useTheme } from '@/contexts/ThemeContext';
import { useReactions } from '@/hooks/useReactions';
import { cn } from '@/utils/cn';

const REACTIONS = [
  { emoji: '🔥', id: 'fire', label: 'Fire' },
  { emoji: '👏', id: 'clap', label: 'Clap' },
  { emoji: '⚡', id: 'zap', label: 'Zap' },
  { emoji: '❤️', id: 'heart', label: 'Heart' },
  { emoji: '😮', id: 'wow', label: 'Wow' },
  { emoji: '🏆', id: 'trophy', label: 'Trophy' },
];

export const ReactionBar: React.FC<{ matchId?: string; className?: string }> = ({
  matchId,
  className,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { aggregates, addReaction } = useReactions(matchId || '');
  const [floating, setFloating] = useState<{ id: number; emoji: string; x: number }[]>([]);

  const handleReact = (id: string, emoji: string, event: React.MouseEvent) => {
    if (matchId) {
      addReaction(id);
    }

    // Create floating animation element
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const newFloat = {
      id: Date.now() + Math.random(),
      emoji,
      x: rect.left + rect.width / 2 - 10,
    };

    setFloating((prev) => [...prev, newFloat]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.id !== newFloat.id));
    }, 2000);
  };

  return (
    <div
      className={cn(
        "border px-3 py-2.5 sm:px-5 sm:py-3 rounded-full inline-flex items-center space-x-2 sm:space-x-4 md:space-x-5 backdrop-blur-xl transition-all shadow-lg",
        isDay
          ? "bg-white/80 border-[#071426]/10 text-[#071426] shadow-[0_4px_20px_rgba(7,20,38,0.05)]"
          : "bg-[#080A0D]/90 border-white/10 text-white shadow-[0_4px_25px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {REACTIONS.map((reaction) => {
        const count = aggregates[reaction.id] || 0;
        return (
          <motion.button
            key={reaction.id}
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => handleReact(reaction.id, reaction.emoji, e)}
            className="flex flex-col items-center group relative focus:outline-none"
            title={reaction.label}
          >
            <span className="text-xl sm:text-2xl md:text-3xl mb-0.5 filter grayscale group-hover:grayscale-0 active:grayscale-0 transition-all select-none">
              {reaction.emoji}
            </span>
            <span
              className={cn(
                "text-[10px] font-black tabular-nums transition-colors",
                isDay
                  ? "text-[#071426]/50 group-hover:text-[#155EEF]"
                  : "text-white/50 group-hover:text-[#FFD21F]"
              )}
            >
              {count}
            </span>
          </motion.button>
        );
      })}

      {/* Floating layer */}
      <AnimatePresence>
        {floating.map((f) => (
          <FloatingReaction key={f.id} emoji={f.emoji} startX={f.x} />
        ))}
      </AnimatePresence>
    </div>
  );
};
