import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export interface SportOption {
  id: string;
  name: string;
  icon: string;
}

const SPORTS_LIST: SportOption[] = [
  { id: 'all', name: 'All Disciplines', icon: '🏆' },
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
  { id: 'hand-tennis', name: 'Hand Tennis', icon: '✋' },
  { id: 'lan-games', name: 'LAN Games', icon: '🎮' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'table-tennis', name: 'Table Tennis', icon: '🏓' },
  { id: 'chess', name: 'Chess', icon: '♚' },
  { id: 'carrom', name: 'Carrom', icon: '🎯' },
  { id: 'smash-karts', name: 'Smash Karts', icon: '🏎️' },
  { id: 'counter-strike', name: 'Counter Strike', icon: '🔫' },
];

export const SportFilterRibbon: React.FC<{
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
}> = ({ selectedSport, onSelectSport }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  return (
    <div className="relative mb-12">
      {/* Horizontal scrollable sport pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {SPORTS_LIST.map((sport) => {
          const isSelected = selectedSport === sport.id;

          return (
            <button
              key={sport.id}
              onClick={() => onSelectSport(sport.id)}
              className={`relative flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border ${
                isSelected
                  ? isDay
                    ? 'bg-[#155EEF] border-[#155EEF] text-white shadow-[0_4px_20px_rgba(21,94,239,0.3)]'
                    : 'bg-gradient-to-r from-[#D9A441] to-[#FFD21F] border-[#FFD21F] text-[#071426] shadow-[0_0_20px_rgba(217,164,65,0.4)]'
                  : isDay
                    ? 'bg-white/70 border-[#071426]/10 text-[#071426]/70 hover:bg-white hover:border-[#071426]/30'
                    : 'bg-[#071426]/70 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <span>{sport.icon}</span>
              <span>{sport.name}</span>
            </button>
          );
        })}
      </div>

      {/* Sport Graphic Background Accent Watermark on change */}
      <motion.div
        key={selectedSport}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden
        className="pointer-events-none absolute right-4 -top-8 select-none text-right font-black uppercase tracking-widest text-[clamp(2rem,6vw,5rem)] opacity-5 z-0"
      >
        {selectedSport}
      </motion.div>
    </div>
  );
};
